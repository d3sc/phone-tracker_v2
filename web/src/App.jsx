import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000/");

const App = () => {
  const [data, setData] = useState([]);
  const [dataLocation, setDataLocation] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    const handleConnectedUser = (dataMessage) => {
      console.log("📌 Connected Users:", dataMessage);

      if (!dataMessage || Object.keys(dataMessage).length === 0) {
        // Jika tidak ada device yang terkoneksi, kosongkan state
        setData([]);
        return;
      }

      setData((prevData) => {
        const isExist = prevData.some(
          (item) => Object.keys(item)[0] === Object.keys(dataMessage)[0]
        );
        return isExist ? prevData : [...prevData, dataMessage];
      });
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
      const res = await fetch("http://localhost:3000/getLocation", {
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

  return (
    <div>
      <h2>Available Devices:</h2>
      {data.length > 0 ? (
        <ul>
          {data.map((device, index) => (
            <li key={index}>
              {index + 1}. {Object.keys(device)[0]}
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
  );
};

export default App;
