import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../config/firebase';
import { Auction } from '../../models/Auction';
import styles from './styles.module.css';

const Home = () => {
  const [image, setImage] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialBid, setInitialBid] = useState('');
  const [tempMax, setTempMax] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const startAuction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !description || !initialBid || !tempMax || !image) {
      alert("Por favor, preencha todos os campos e selecione uma imagem.");
      return;
    }
    setSubmitting(true);

    const uuid = crypto.randomUUID();
    const storageRef = ref(storage, `products/${uuid}`);

    try {
      const imageSnapshot = await uploadBytes(storageRef, image);
      const imageURL = await getDownloadURL(imageSnapshot.ref);

      const auctionData: Auction = {
        id: uuid,
        imageURL,
        title,
        description,
        initialBid: parseFloat(initialBid),
        tempMax: parseInt(tempMax) * 60,
      };

      await axios.post('http://localhost:3001/auctions', auctionData);
      navigate('/auction', { state: { auction: auctionData } });
    } catch (error) {
      console.error('Erro ao iniciar o leilão:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.auctionForm} onSubmit={startAuction}>
        <input type="file" required onChange={e => setImage(e.target.files ? e.target.files[0] : null)} />
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Título do Produto" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Descrição do Produto" />
        <input type="number" value={initialBid} onChange={e => setInitialBid(e.target.value)} required placeholder="Lance Inicial (R$)" />
        <input type="number" value={tempMax} onChange={e => setTempMax(e.target.value)} required placeholder="Tempo Máximo do Leilão (minutos)" />
        <button type="submit">Iniciar Leilão</button>
      </form>
      {submitting && <p>Enviando dados...</p>}
    </div>
  );
};

export default Home;
