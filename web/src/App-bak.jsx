import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000/");

const App = () => {
  const [data, setData] = useState([]);
  const [dataLocation, setDataLocation] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.on("connectedUser", (dataMessage) => {
      setData((prevData) => [...prevData, dataMessage]);
      console.log(dataMessage);
    });
    socket.on("newLocation", (dataLocation) => {
      setDataLocation((prevData) => [...prevData, dataLocation]); // Salin array lama dan tambahkan data baru
      setLoading(false);
      setMessage("Location Obtained!");
    });

    return () => {
      socket.off("connectedUser");
      socket.off("newLocation");
    };
  }, []);

  const getLocation = async (userId) => {
    setLoading(true);
    setMessage("Getting Location..");

    const res = await fetch("http://localhost:3000/getLocation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Pastikan ini benar
      },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();
    if (!data.success) {
      setMessage(data.message);
    }
  };

  return (
    <div>
      {/* <form action="http://localhost:3000/getLocation" method="post">
        <input type="hidden" name="userId" value={"SnippetCoder"} />
        <button type="submit">Get Location</button>
      </form> */}

      <p>available device :</p>
      <ul>
        {data?.map((device, index) => (
          <li key={index}>
            {/* {console.log(device[1])} */}
            {index}. {Object.keys(device)[0]}
          </li>
        ))}
      </ul>

      <p>{message ? `status : ${message}` : "status :"}</p>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <button onClick={() => getLocation("c0e210e28debfeba")}>
          Get Location
        </button>
      )}

      <h1>Location :</h1>
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
      {/* <h1>Messages :</h1>
      <ul>
        {data.map((msg, index) => (
          <li key={index}>
            <strong>{msg.title}:</strong> {msg.content}
          </li>
        ))}
      </ul> */}
    </div>
  );
};

export default App;
