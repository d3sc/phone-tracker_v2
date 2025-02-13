import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const url = "https://server-js.d3sc.my.id"

const socket = io(`${url}/`);

const App = () => {
  const [data, setData] = useState([]);
  const [dataLocation, setDataLocation] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [unlock, setUnlock] = useState(false);
  const usernameRef = useRef();
  const passwordRef = useRef();

  useEffect(() => {
    const handleConnectedUser = (dataMessage) => {
      console.log("📌 Connected Users:", dataMessage);

      if (!dataMessage || Object.keys(dataMessage).length === 0) {
        // Jika tidak ada device yang terkoneksi, kosongkan state
        setData([]);
        return;
      }

      // Ubah objek menjadi array key-value
      const newDevices = Object.entries(dataMessage).map(([id, value]) => ({
        id,
        value,
      }));

      setData(newDevices); // Ganti state dengan data baru
    };

    const handleNewLocation = (locationData) => {
      setDataLocation((prevData) => {
        const isExist = prevData.some(
          (item) =>
            item.latitude === locationData.latitude &&
            item.longitude === locationData.longitude
        );
        return isExist ? prevData : [...prevData, locationData];
      });

      setLoading(false);
      setMessage("✅ Location Obtained!");
    };

    socket.on("connectedUser", handleConnectedUser);
    socket.on("newLocation", handleNewLocation);

    return () => {
      socket.off("connectedUser", handleConnectedUser);
      socket.off("newLocation", handleNewLocation);
    };
  }, []);

  const getLocation = async () => {
    setLoading(true);
    setMessage("⏳ Getting Location..");

    if (!text) {
      setMessage("Input Must be filled!");
      setLoading(false);
    }

    try {
      const res = await fetch(`${url}/getLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: text }),
      });

      const data = await res.json();
      if (!data.success) {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      setMessage("❌ Failed to fetch location");
    }
  };

  
  const MainDisplay = () => {
    return (
      <div>
      <h2>Available Devices:</h2>
      {data.length > 0 ? (
        <ul>
          {data.map((device, index) => (
            <li key={index}>
              {index + 1}. {device.id}
            </li>
          ))}
        </ul>
      ) : (
        <p>🚫 No devices connected</p>
      )}

      <p>{message ? `📌 Status: ${message}` : "📌 Status: -"}</p>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="">
          <input type="text" onChange={(e) => setText(e.target.value)} />
          <button onClick={getLocation}>Get Location</button>
        </div>
      )}

      <h2>Location Data:</h2>
      {dataLocation.length > 0 ? (
        <ul>
          {dataLocation.map((location, index) => (
            <li key={index}>
              <strong>
                {location.latitude}, {location.longitude}:
              </strong>{" "}
              <a href={location.gmapsLink}>{location.gmapsLink}</a>
              <p>IMEI: {location.imei}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>📍 No location data available</p>
      )}
    </div>
    )
  }

  const loginProcess = () => {
    const username = usernameRef.current.value;
    const password = passwordRef.current.value;
    if(!username && !password) return alert("harus di isi!!");

    if(username == "admin" && password == "Upilkuda686") {
      setUnlock(true);
      return;
    } else {
      return alert("salah men!!");
    }
  }


  const LoginDisplay = () => {
    return (
      <div className="">
        <label htmlFor="username">Username</label>
      <input type="text" ref={usernameRef} />

      <label htmlFor="password">Password</label>
      <input type="password" ref={passwordRef} />
        <button onClick={loginProcess}>Submit</button>
      </div>
    )
  }

  return unlock ? <MainDisplay /> : <LoginDisplay />
    
  ;
};

export default App;
