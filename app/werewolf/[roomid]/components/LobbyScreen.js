import { useRouter } from "next/navigation";
import Image from "next/image";
import Cookies from "universal-cookie";

import { useEffect, useState, useContext } from "react";
import { LanguageContext } from "../../layout";

const isSSR = typeof window === "undefined";

const LobbyScreen = ({ roomId, playersData, position, socket }) => {
  const { changeLanguage, handleOnLanguageChange } =
    useContext(LanguageContext);
  const [radiusX, setRadiusX] = useState(300); // Default radiusX
  const [radiusY, setRadiusY] = useState(150); // Default radiusY
  // Update radii based on screen size
  useEffect(() => {
    const updateRadius = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      setRadiusX(screenWidth * 0.3); // 30% of screen width
      setRadiusY(screenHeight * 0.2); // 20% of screen height
    };

    // Initial calculation
    updateRadius();

    // Recalculate on window resize
    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  const router = useRouter();
  const cookies = new Cookies();

  const email = isSSR ? "no-email" : cookies.get("email");
  const player = playersData.map((x) => x.name);

  function handleGameStart() {
    socket.emit("allRoleAssign", { roomId: roomId, data: playersData });
    socket.emit("gameStart", { roomId: roomId, start: true });
  }

  function handleLogout() {
    socket.emit("logOut", { roomId: roomId, email: email });
    router.push(`/werewolf`);
  }

  const OvalWithItems = ({ items, radiusX, radiusY }) => {
    const centerX = radiusX * 1.65; // X coordinate of the oval center
    const centerY = radiusY * 2.4; // Y coordinate of the oval center
    return (
      <svg width="100%" height="100%" className="absolute">
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={radiusX}
          ry={radiusY}
          opacity="0.2"
          fill={"white"}
        />

        {items.map((item, index) => {
          const angle = (index / items.length) * 2 * Math.PI; // angle in radians
          const x = centerX + radiusX * Math.cos(angle); // X position
          const y = centerY + radiusY * Math.sin(angle); // Y position

          return (
            <g
              key={item.id}
              transform={`translate(${x}, ${y})`}
              className="relative"
            >
              <text
                x="0"
                y="60"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
              >
                {item.name}
              </text>
              <image
                href={
                  "https://static.tvtropes.org/pmwiki/pub/images/plaguebearer.png"
                }
                width="100"
                height="100"
                x="-50" // Center the image
                y="-50" // Center the image
                className="hover:scale-105 transition duration-150 ease-in-out cursor-pointer"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    // Game Content
    <div className="flex-1 p-2 h-screen w-screen">
      {/* star Background */}
      <div className="fixed inset-0 bg-black overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                animation: `twinkle ${Math.random() * 5 + 5}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
        <style jsx>{`
          @keyframes twinkle {
            0% {
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }
        `}</style>
      </div>
      <div className="flex flex-col items-center h-full w-full relative z-0 border-2">
        {/* Room Title */}
        <h1 className="flex justify-center text-xl text-white h-[8%] w-full border-2 z-10">
          {changeLanguage ? "Room ID: " : "目前房間: "}
          {roomId}
        </h1>

        <div className="h-[82%] w-full border-2 flex justify-center items-center">
          <OvalWithItems
            items={playersData}
            radiusX={radiusX}
            radiusY={radiusY}
          />
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-2 h-[10%] w-full border-2 relative">
          {playersData[position]?.id === playersData[0]?.id && (
            <button
              className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded"
              onClick={handleGameStart}
            >
              {changeLanguage ? "Start Game " : "開始遊戲 "}
            </button>
          )}
          <button
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded"
            onClick={handleLogout}
          >
            {changeLanguage ? "Leave Room" : "離開房間 "}
          </button>
        </div>
      </div>
    </div>
  );
};

// <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-6 text-lg">
//   <div className="flex justify-between items-center mb-6">
//     <h1 className="text-2xl font-bold">{changeLanguage ? "Game Lobby" : "遊戲大廳"}</h1>
//     <button
//       onClick={handleOnChange}
//       className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
//     >
//       {changeLanguage ? "中文" : "English"}
//     </button>
//   </div>
//   <div className="mb-4">
//     <span className="font-semibold">{changeLanguage ? "Room ID: " : "房間號碼: "}</span> {roomid}
//   </div>
//   <div className="mb-4">
//     <span className="font-semibold">{changeLanguage ? "Name:" : "名稱:"}:</span> {name}
//   </div>
//   <div className="mb-6">
//     <h2 className="text-lg font-semibold mb-2">{changeLanguage ? "Player: " : "玩家: "}</h2>
//     <div className="max-h-40 overflow-y-auto border rounded-md p-2">
//       {players.map((info) => (
//         <div key={info.id} className="py-1">
//           {info.name}
//         </div>
//       ))}
//     </div>
//   </div>
//   {roomLeader && (
//     <button
//       onClick={handleGameStart}
//       className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors mb-4"
//     >
//       {changeLanguage ? "Start Game" : "開始遊戲"}
//     </button>
//   )}
//   {typeof playersData === "string" && <div className="text-red-500 mb-4">{playersData}</div>}
//   <button
//     onClick={handleLogout}
//     className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors mb-6"
//   >
//     {changeLanguage ? "Leave Room" : "離開房間"}
//   </button>
//   <div>
//     <h2 className="text-xl font-bold mb-2">
//       {changeLanguage ? "Role introduction & Victory Condition" : "角色資料&勝利條件"}
//     </h2>
//     <CharacterSkill changeLanguage={changeLanguage} />
//   </div>
// </div>

export default LobbyScreen;