import { useLocation, useNavigate } from 'react-router-dom'
import { Auction } from '../../models/Auction'
import styles from './styles.module.css'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import BidCard from '../../components/BidCard'
import { SocketContext } from '../../context/SocketContext'

export type Bid = {
  value: number,
  user: string,
  username: string,
  auctionId: string,
}

type Location = {
  state: {
    auction: Auction
  }
}

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const LiveAuction = () => {
  const location: Location = useLocation()
  const navigate = useNavigate()
  const { auction } = location.state

  const [bids, setBids] = useState<Bid[]>([])
  const [highestBid, setHighestBid] = useState<Bid | null>(null)
  const [lastBid, setLastBid] = useState<Bid | null>(null) // Novo estado para armazenar a última oferta
  const bottomEl = useRef<HTMLDivElement>(null)
  const { socket } = useContext(SocketContext)
  const [tempo, setTempo] = useState(auction.tempMax * 60);
  const[valorInit, setValorInit] = useState(auction.initialBid) // Alterado para armazenar o valor numérico do lance inicial
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const lastBidTime = useRef(Date.now());
  const auctionStartTimeoutId = useRef<NodeJS.Timeout | null>(null); // Novo useRef para o timeout de início do leilão
  const [isAuctionFinished, setIsAuctionFinished] = useState(false); // Novo estado para verificar se o leilão foi finalizado
  


  //esse useeffect é pra funcionar o cronometro
  useEffect(() => {
    if (tempo > 0) {
      const intervalo = setInterval(() => {
        setTempo(tempoAnterior => tempoAnterior - 1);
      }, 1000);
      return () => clearInterval(intervalo);
    } else {
      console.log('Cronômetro concluído');
      if (lastBid) {
        window.alert(`Leilão finalizado. O arrematador foi ${lastBid.user} com o lance de ${lastBid.value}`);
      } else {
        window.alert('Leilão finalizado');
      }
      setIsAuctionFinished(true);
    }
  }, [tempo]);

  const handleMessageReceived = useCallback((messageObj: Bid) => {
    console.log('Message received');
    console.log(messageObj);
  
    // Verifica se o leilão já terminou antes de aceitar novas ofertas
    if (isAuctionFinished) {
      console.log('Leilão já terminou. Ignorando nova oferta.');
      return;
    }
  
    // Verifica se a oferta é maior ou igual ao lance inicial
    if (messageObj.value < valorInit) {
      console.log('Oferta ignorada. O valor é menor que o lance inicial.');
      return;
    }
  
    const updatedBids = [...bids, messageObj];
    setBids(updatedBids);
    lastBidTime.current = Date.now();
  
    setHighestBid(messageObj);
    setLastBid(messageObj); // Atualiza a última oferta sempre que uma nova oferta é recebida
  
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
      //verifica o ultimo lance dado e apresenta como ganhador
    timeoutId.current = setTimeout(() => {
      const timeSinceLastBid = Date.now() - lastBidTime.current;
      if (timeSinceLastBid >= 10000) {
        socket.emit('Leilão finalizado', { message: 'Nenhum lance foi feito dentro de 10 segundos' });
        if (highestBid) {
          window.alert(`Leilão finalizado. O arrematador foi ${highestBid.user} com o lance de ${highestBid.value}`);
        } else {
          window.alert('Leilão finalizado');
        }
        setIsAuctionFinished(true); // Define o estado isAuctionFinished como true quando o leilão é finalizado
      }
    }, 10000);

    // Limpa o timeout de início do leilão quando um lance é recebido
    if (auctionStartTimeoutId.current) {
      clearTimeout(auctionStartTimeoutId.current);
    }
  }, [bids, isAuctionFinished, valorInit]); // Adiciona valorInit às dependências do useCallback

  socket.on(`${process.env.REACT_APP_MESSAGE_RECEIVED_EVENT}`, handleMessageReceived)

  useEffect(() => {
    bottomEl?.current?.scrollIntoView({ behavior: 'smooth' })
  }, [bids])

  const handleBackClick = () => {
    navigate('/')
  }

  // Novo useEffect para verificar se algum lance foi feito nos primeiros 10 segundos
  useEffect(() => {
    auctionStartTimeoutId.current = setTimeout(() => {
      if (bids.length === 0) {
        window.alert('Leilão cancelado');
        // Aqui você pode adicionar mais código para lidar com o cancelamento do leilão
      }setIsAuctionFinished(true);
    }, 10000);

    return () => {
      if (auctionStartTimeoutId.current) {
        clearTimeout(auctionStartTimeoutId.current);
      }
    };
  }, []);

  return (
    <div className={styles.container}>

      <h1 className={styles.auctionTitle}>Leilão ao vivo do item


 "{auction.title}"</h1>
      
      <h1>{formatTime(tempo) /*formato o temporizador*/ }</h1>
      <h1>{(valorInit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })/*formato o valor inicial para real*/)}</h1>

      <div id='scroll-area' className={styles.liveAuctionArea}>
        {[...bids].sort((a, b) => a.value - b.value).map((b, index) => <BidCard key={index} bid={b} />)}
        <div ref={bottomEl}></div>

      </div>
      
      {isAuctionFinished && <input type="submit" value="Voltar tela de inicio " onClick={handleBackClick} />}

    </div>
  )
}

export default LiveAuction
