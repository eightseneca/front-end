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
  createdTime: ethers.BigNumber;
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
  const tx = await DocumentTracker.connect(signer).transferFrom(sender, receiver, tokenId);
  alert(`Transfer token success with tx ${tx.hash}`);
}

async function upload(content: string) {
  console.log(`Start upload file`);
  const [isFileExist, tokenId] = await DocumentTracker.contentIndex(content);
  if (isFileExist) {
    const tokenInfo = await DocumentTracker.trackers(tokenId);
    const currentOwner = await DocumentTracker.ownerOf(tokenId);
    alert(`File was uploaded at ${tokenInfo.createdTime.toNumber()}, org owner is ${tokenInfo.orgOwner}, and current owner is ${currentOwner}`);
  } else {
    console.log(`Start uploading file`);
    const signer = Provider.getSigner();
    const tx = await DocumentTracker.connect(signer).mint(content);
    alert(`Upload success with tx ${tx.hash}`);
  }
}

function App() {

  // @ts-ignore
  const { ethereum } = window;
  const [account, setAccount] = useState('');

  const [tokensList, setTokensList] = useState<DocumentTrackerToken[]>([]);

  const [addressTransferInput, setAddressTransferInput] = useState('');
  const [nftUsed, setNftUsed] = useState<number>(-1);

  const [fileContentUpload, setFileContentUpload] = useState('');

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

  const [uploadIsOpen, setUploadIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  function openUpload() {
    setUploadIsOpen(true);
  }

  function closeUpload() {
    setUploadIsOpen(false);
  }

  return (
    <div className="App">
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Transfer token"
      >
        <button onClick={closeModal}>close</button>
        <div>Address you want to transfer</div>
          <input onChange={(event) => setAddressTransferInput(event.target.value)}/>
          <button onClick={() => transferTo(nftUsed, account, addressTransferInput)}>Confirm Transfer</button>
      </Modal>

      <Modal
        isOpen={uploadIsOpen}
        onRequestClose={closeUpload}
        contentLabel="Upload file"
      >
        <button onClick={closeUpload}>close</button>
        <div>File you want to upload</div>
        <input type='file' onChange={async (event) => {
          event.preventDefault();
          const reader = new FileReader();
          reader.onload = async (event) => {
            // @ts-ignore
            const text = (event.target.result);
            // @ts-ignore
            setFileContentUpload(ethers.utils.keccak256(Buffer.from(text)));
          }
          // @ts-ignore
          reader.readAsText(event.target.files[0]);
        }}/>
        <button onClick={() => upload(fileContentUpload)}>Upload</button>
      </Modal>

      <header className="App-header">
        <button onClick={openUpload}>Upload file content</button>
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
