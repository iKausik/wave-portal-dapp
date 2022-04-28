import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import abi from "./contracts/WavePortal.json";

const App = () => {
  const [isWalletConected, setIsWalletConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [allWaves, setAllWaves] = useState([]);
  const [msg, setMsg] = useState("");

  const contractAddress = "0x17920cDc894B92F61c57a46AdbCdd118e22ddE90";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];

        setIsWalletConnected(true);
        setCurrentAccount(account);

        console.log("Connected", account);
      } else {
        alert("Connect your Ethereum Wallet");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async (event) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        // execute the actual wave from your smart contract
        // const waveTxn = await wavePortalContract.wave();
        const waveTxn = await wavePortalContract.wave(msg, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined --", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAllWaves = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();

        // let wavesCleaned = [];
        // waves.forEach((wave) => {
        //   wavesCleaned.push({
        //     address: wave.waver,
        //     timestamp: new Date(wave.timestamp * 1000),
        //     message: wave.message,
        //   });
        // });

        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleMsgInput = (event) => {
    setMsg(event.target.value);
  };

  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    // getAllWaves();

    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">👋 Hey there!</div>

        <div className="bio">
          I am Kausik and I worked on web3, that's pretty cool right? Connect
          your Ethereum wallet and wave at me!
        </div>

        <button className="waveButton" onClick={checkIfWalletIsConnected}>
          {isWalletConected
            ? `Wallet Connected 🔒 ${currentAccount}`
            : "Connect Wallet 🔑"}
        </button>

        <br />
        <div>
          <form className="dataContainer">
            <label htmlFor="msg">
              <h3>Write a message to wave:</h3>
            </label>
            <textarea
              type="text"
              name="msg"
              id="msg"
              rows={6}
              placeholder="write here..."
              onChange={handleMsgInput}
              value={msg}
            />

            <button className="waveButton" onClick={wave}>
              Wave at Me
            </button>
          </form>
        </div>

        <br />
        {allWaves.map((wave, index) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: "OldLace",
                marginTop: "16px",
                padding: "8px",
              }}
            >
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
