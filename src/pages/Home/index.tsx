import { useContext, useState } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

import styles from './styles.module.css'
import { storage } from '../../config/firebase'
import { Auction } from '../../models/Auction'
import { useNavigate } from 'react-router-dom'
import { BeatLoader } from 'react-spinners'
import { SocketContext } from '../../context/SocketContext'

export function formatTime(minutes: number) {
  const seconds = minutes * 60;
  const remainingMinutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const Home = () => {
  const [image, setImage] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [initialBid, setInitialBid] = useState(1)
  const [tempMax, setTempMax] = useState(1) // Armazenando minutos
  const [submitting, isSubmitting] = useState(false)

  const [auctionHistory, setAuctionHistory] = useState<Auction[]>([]); //para pegar historico de leilões

  const navigate = useNavigate()
  const { socket } = useContext(SocketContext)

  

  const startAuction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    isSubmitting(true)

    // Envia a foto do produto para o Storage
    const uuid = crypto.randomUUID()
    const storageRef = ref(storage, `products/${uuid}`)

    try {
      await uploadBytes(storageRef, image as File)
      const imageURL = await getDownloadURL(storageRef)
      const auction: Auction = { id: uuid, imageURL, title, description, initialBid, tempMax } // Convertendo minutos para segundos
      console.log(auction)

      socket.emit(`${process.env.REACT_APP_AUCTION_STARTED_EVENT}`, auction)

      navigate('/auction', { state: { auction } })
    } catch (err) {
      console.log(err)
      isSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.auctionArea}>
        <form
          className={styles.auctionForm}
          onSubmit={(e) => startAuction(e)} >
          <input
            type="file"
            required
            placeholder='Escolha uma foto do produto'
            accept='image/png,image/jpeg'
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setImage(e.target.files[0])
              }
            }} />

          <input
            required
            type="text"
            value={title}
            placeholder='Título do produto'
            onChange={(e) => setTitle(e.target.value)} />

          <textarea
            required
            placeholder='Descrição do produto'
            value={description}
            onChange={(e) => setDescription(e.target.value)}>
          </textarea>

          <label htmlFor="lanceInicial">
            Lance inicial (R$)
          </label>

          <input

            type="number"
            required
            placeholder='Lance inicial (R$)'
            min='1'
            value={initialBid}
            onChange={(e) => setInitialBid(+e.target.value)} />

          <label htmlFor="Tempo Maximo de leilão">
            Tempo Maximo de leilão
          </label>

          <input
            type="number"
            required
            placeholder={`Tempo Maximo de leilão (${formatTime(tempMax)})`} // Exibindo minutos e segundos no placeholder
            min='1'
            value={tempMax}
            onChange={(e) => setTempMax(+e.target.value)} // Armazenando minutos
          />

          <p>{formatTime(tempMax)}</p>

          <input type="submit" value="Iniciar" />
        </form>
      </div>

      <BeatLoader color='#555' loading={submitting} />
    </div>
  )
}
export default Home
