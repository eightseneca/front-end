import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';
import {DocumentTracker, Provider} from './web3';
import {ethers} from 'ethers';
import {Buffer} from 'buffer';
import Modal from 'react-modal';

interface DocumentTrackerToken {
  hashContent: string;
  orgOwner: string;
  tokenId: number;

}
async function getAllTokensOfUser(userAddress: string): Promise<DocumentTrackerToken[]> {
  const balance = (await DocumentTracker.balanceOf(userAddress)).toNumber();
  const tokenIds = await Promise.all(Array.from(Array(balance).keys()).map(async (ind) => await DocumentTracker.tokenOfOwnerByIndex(userAddress, ind)));
  return await Promise.all(tokenIds.map(async (tokenId) => {
    const content =  await DocumentTracker.trackers(tokenId)
    return {
      tokenId: tokenId.toNumber(),
      ...content,
    };
  }
));
}

async function transferTo(tokenId: number, sender: string, receiver: string) {
  const signer = Provider.getSigner();
  console.log(`Start transfer from ${sender} to ${receiver} token ${tokenId}`);
  await DocumentTracker.connect(signer).transferFrom(sender, receiver, tokenId);
}

function App() {

  // @ts-ignore
  const { ethereum } = window;
  const [account, setAccount] = useState('');

  const [tokensList, setTokensList] = useState<DocumentTrackerToken[]>([]);

  const [addressTransferInput, setAddressTransferInput] = useState('');
  const [nftUsed, setNftUsed] = useState<number>(-1);

  useEffect(() => {
    ethereum.request({ method: 'eth_requestAccounts'})
      .then((result) => {
        setAccount(ethers.utils.getAddress(result[0]));
      }).catch((error) => {
      console.log(error)
    })

    ethereum.on('accountsChanged', (accounts) => {
      console.log(`Account changed to ${accounts[0]}`);
      setAccount(ethers.utils.getAddress(accounts[0]));
    })
  }, []);


  async function getTokenList(account) {
    const tmp = await getAllTokensOfUser(account);
    setTokensList(tmp);
  }


  useEffect( () => {
    getTokenList(account);
  }, [account])

  const [modalIsOpen, setIsOpen] = React.useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  function closeModal() {
    setIsOpen(false);
  }



  // const signer = Provider.getSigner();
  // const content = Buffer.from("This is file B");
  // DocumentTracker.connect(signer).mint(ethers.utils.keccak256(content)).then((result) => console.log(`Mint success result is ${result}`))
  //   .catch((error) => console.log(`Mint failed, result is ${error}`));

  return (
    <div className="App">
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        contentLabel="Example Modal"
      >
        <button onClick={closeModal}>close</button>
        <div>Address you want to transfer</div>
          <input onChange={(event) => setAddressTransferInput(event.target.value)}/>
          <button onClick={() => transferTo(nftUsed, account, addressTransferInput)}>Confirm Transfer</button>
      </Modal>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Account of user is <b>{ account }</b>
        </p>

        <p>
          Balance of user is { tokensList.length }
        </p>

        {
          tokensList.map((token) => <div key={token.tokenId}><b>{token.tokenId}</b> - { token.hashContent} - <button onClick={() =>
          {
            setNftUsed(token.tokenId);
            setIsOpen(true)}}>
            Transfer</button></div>)
        }
      </header>
    </div>
  );
}

export default App;
