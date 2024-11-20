"use client";

import { useEffect, useState, useRef, useContext } from "react";
import characterData from "../data/character";
import AliveChatAndTarget from "./AliveChatAndTarget";
import fungPlayerData from "../data/fungPlayerData";
import DeadPlayerList from "./DeadPlayerList";
import AllChatRoom from "./AllChatRooms";
import Image from "next/image";
import nightBg from "@/public/image/nightBg.jpg";
import { LanguageContext } from "../../layout";
// import WholeDayChatRoom from "./WholeDayChatRoom";
// import DayChatRoom from "./DayChatRoom";
// import NightChatRoom from "./NightChatRoom";
import RoleCard from "./RoleCard";

export default function Night({
  socket,
  day,
  setDay,
  name,
  roomId,
  dayTimeChat,
  setShowWhichChat,
  showWhichChat,
  nightTimeChat,
  setNightTimeChat,
  setVampireNightTimeChat,
  vampireNightTimeChat,
  deadPlayerChat,
  setDeadPlayerChat,
  role,
  players,
  position,
  playersData,
  setPlayersData,
  nights,
  setNights,
  setDetectiveAbilityInfo,
  setSentinelAbilityInfo,
  cupidAbilityUsed,
  deadPlayerMessageSent,
  setDayTimeChat,
  setPlayerDiedLastNight,
  canShoot,
  setCanShoot,
  initialVampire,
  roomLeader,
}) {
  const [timer, setTimer] = useState(30);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState(null);
  const [currAction, setCurrAction] = useState(null);
  const [twistedFateTarget, setTwistedFateTarget] = useState(null);
  const [fade, setFade] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const { changeLanguage, handleOnLanguageChange } = useContext(LanguageContext);
  const targetRef = useRef(target);
  const actionRef = useRef(currAction);
  const twistedFateTargetRef = useRef(twistedFateTarget);
  const twistedFateDropDownList = fungPlayerData.filter(
    (role) => role.faction !== "witch" && role.roleName !== "detective"
  );

  useEffect(() => {
    setTimer(30);
    setFade(true);
    setCurrAction(actions[role]);

    socket.emit("resetDayAction", { roomId });

    const action = setInterval(() => {
      socket.emit("nightAction", {
        nights,
        position,
        roomId,
        target: targetRef.current,
        action: actionRef.current,
        twistedTarget: twistedFateTargetRef.current,
      });
    }, timer * 1000);

    const nightTime = setInterval(() => {
      setFadeOut(true);
      setNights((prev) => prev + 1);
      socket.emit("sendSetDay", { roomId, dayTime: true });
    }, timer * 1000 + 1000);

    const clockTimer = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    setPlayerDiedLastNight([]);
    handleMessageSent();

    socket.emit("clearVotes", roomId);
    setPlayersData((prev) => prev.map((player) => ({ ...player, vote: 0 })));

    return () => {
      clearInterval(action);
      clearInterval(nightTime);
      clearInterval(clockTimer);
    };
  }, []);

  useEffect(() => {
    targetRef.current = target;
    actionRef.current = currAction; // Update ref whenever state changes
    twistedFateTargetRef.current = twistedFateTarget;
  }, [target, currAction, twistedFateTarget]);

  const actions = {
    reaper: "kill",
    police: "kill",
    detective: "detect",
    defender: "protect",
    sentinel: "lookOut",
    scammer: "scam",
    reminiscence: "remember",
    vampire: "convert",
    vampireHunter: "vampireKill",
    twistedFate: "destiny",
    joker: "kill",
  };

  useEffect(() => {
    socket.on("allNightChat", (data) => {
      setNightTimeChat(data);
    });
    socket.on("sendAllSetDay", ({ dayTime }) => {
      setDay(dayTime);
    });
    socket.on("allVampireNightChat", (data) => {
      setVampireNightTimeChat(data);
    });
    socket.on("allDeadPlayerChat", (data) => {
      setDeadPlayerChat(data);
    });
    socket.on("allNightAction", (nightTimeAction) => {
      nightTimeAction.forEach((actions) => {
        handleNightAction(actions, nightTimeAction);
      });
    });
    socket.on("allDayChat", (data) => {
      setDayTimeChat(data);
    });
  }, [socket]);

  function handleMessageSent() {
    socket.emit("nightChat", { name, roomId, message });
    setMessage("");
  }

  function handleVampireMessageSent() {
    socket.emit("vampireNightChat", { name, roomId, message });
    setMessage("");
  }

  function handleNightAction(actions, nightTimeAction) {
    if (actions.action === "kill") {
      const townFaction = Object.keys(characterData.town);
      if (playersData[actions.target].linked === true && !playersData[actions.target].jailed) {
        const linkedArr = [];
        playersData.forEach((player, index) => {
          if (player.linked === true) {
            linkedArr.push(index);
          }
        });
        setPlayerDiedLastNight((prev) => [...prev, ...linkedArr]);
        setPlayersData((prev) => prev.map((player) => (player.linked === true ? { ...player, alive: false } : player)));
        setPlayersData((prev) =>
          prev.map((player, index) => (index === actions.owner ? { ...player, votedOut: false } : player))
        );
        if (playersData[actions.owner].role === "police" && townFaction.includes(playersData[actions.target].role)) {
          setCanShoot(false);
        }
      }
      if (playersData[actions.target].linked === false && !playersData[actions.target].jailed) {
        setPlayersData((prev) =>
          prev.map((player, index) => (index === actions.target ? { ...player, alive: false } : player))
        );
        setPlayersData((prev) =>
          prev.map((player, index) => (index === actions.owner ? { ...player, votedOut: false } : player))
        );
        setPlayerDiedLastNight((prev) => [...prev, actions.target]);
        if (playersData[position].role === "police" && townFaction.includes(playersData[actions.target].role)) {
          setCanShoot(false);
        }
      }
    }

    if (actions.action === "detect") {
      // get the detected player name
      const detectedName = playersData[actions.target].name;
      // get the role good or bad
      const detectedRole = playersData[actions.target].detected;
      setDetectiveAbilityInfo({ name: detectedName, detected: detectedRole });
    }

    if (actions.action === "protect") {
      if (playersData[actions.target].alive === false) {
        console.log("you successfully protected someone");
      }
      setPlayersData((prev) =>
        prev.map((player, index) => (index === actions.target ? { ...player, alive: true } : player))
      );
    }

    if (actions.action === "lookOut") {
      const playerVisit = nightTimeAction.filter((player) => {
        return player.target === actions.target;
      });
      setSentinelAbilityInfo(playerVisit);
    }

    if (actions.action === "scam") {
      setDetectiveAbilityInfo((prev) => ({ ...prev, detected: "bad" }));
    }

    if (actions.action === "remember") {
      const targetRole = playersData[actions.target].role;
      setPlayersData((prev) =>
        prev.map((player, index) => (index === actions.owner ? { ...player, role: targetRole } : player))
      );
    }

    if (actions.action === "convert") {
      const witch = Object.keys(characterData.witch);
      const targetRole = playersData[actions.target].role;
      if (targetRole !== "vampireHunter") {
        if (witch.includes(targetRole)) {
          setPlayersData((prev) =>
            prev.map((player, index) => (index === actions.target ? { ...player, alive: false } : player))
          );
          setPlayerDiedLastNight((prev) => [...prev, actions.target]);
        }
        if (!witch.includes(targetRole)) {
          setPlayersData((prev) =>
            prev.map((player, index) => (index === actions.target ? { ...player, role: "vampire" } : player))
          );
        }
      }
      if (targetRole === "vampireHunter") {
        setPlayersData((prev) =>
          prev.map((player, index) => (index === actions.owner ? { ...player, alive: false } : player))
        );
        setPlayerDiedLastNight((prev) => [...prev, actions.owner]);
      }
    }

    if (actions.action === "vampireKill") {
      const targetRole = playersData[actions.target].role;

      if (targetRole === "vampire") {
        setPlayersData((prev) =>
          prev.map((player, index) => (index === actions.target ? { ...player, alive: false } : player))
        );
        setPlayerDiedLastNight((prev) => [...prev, actions.target]);
      }
    }

    if (actions.action === "destiny") {
      if (actions.twistedTarget === playersData[actions.target].role) {
        setPlayersData((prev) =>
          prev.map((player, index) => (index === actions.target ? { ...player, alive: false } : player))
        );
        setPlayerDiedLastNight((prev) => [...prev, actions.target]);
      } else if (roomLeader) {
        socket.emit("dayChat", {
          name: "server",
          message: `${playersData[actions.owner].name} 
          ${changeLanguage ? "is twistedFate and is trying to kill" : "係賭徒，佢想賭你身份並殺你"}
          
          ${playersData[actions.target].name}`,
          roomId: roomId,
          repeat: "no",
        });
      }
    }
  }

  function handleDeadPlayerMessageSent() {
    socket.emit("deadPlayerChat", { name, roomId, message });
    setMessage("");
  }

  return (
    <div
      className={`mainContainer flex flex-col w-screen h-screen text-white transition-all duration-300 ease-out ${
        fadeOut ? "bg-white" : fade ? "bg-gray-700" : "bg-white"
      }`}
    >
      <div className="absolute inset-0 z-0">
        <Image src={nightBg} alt="kowloon" className="w-full h-full object-cover opacity-30" />
      </div>
      <div
        className={`w-screen h-screen flex flex-row justify-between transition-opacity duration-300 z-10 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="border-2 border-red-300 w-1/4">
          <div className="h-1/2">
            <DeadPlayerList
              setTarget={setTarget}
              playersData={playersData}
              position={position}
              day={day}
              target={target}
            />
          </div>
          <div className="h-1/2 border-2 border-red-300">
            <AllChatRoom
              show={{
                day: true,
                dead: !playersData[position].alive,
                witch: Object.keys(characterData.witch).includes(role),
                vampire: Object.keys(characterData.neutral)[0] === role,
                medium: role === "medium" && playersData[position].alive,
              }}
              playersData={playersData}
              position={position}
              role={role}
              setMessage={setMessage}
              message={message}
              day={day}
              // sentDayMessage={handleMessageSent}
              sentDeadMessage={handleDeadPlayerMessageSent}
              sentWitchMessage={handleMessageSent}
              sentVampireMessage={handleVampireMessageSent}
              dayChat={dayTimeChat}
              witchChat={nightTimeChat}
              deadChat={deadPlayerChat}
              vampireChat={vampireNightTimeChat}
            />
            {/* <DayChatRoom
                playersData={playersData}
                position={position}
                dayTimeChat={dayTimeChat}
                setShowWhichChat={setShowWhichChat}
                showWhichChat={showWhichChat}
                setMessage={setMessage}
                message={message}
                handleMessageSent={handleMessageSent}
              /> */}
            {/* // vampire chat */}
            {/* {Object.keys(characterData.neutral)[0] === role && (
                <NightChatRoom
                  nightTimeChat={vampireNightTimeChat}
                  message={message}
                  setMessage={setMessage}
                  handleMessageSent={handleVampireMessageSent}
                  playersData={playersData}
                  position={position}
                  role={role}
                />
              )} */}
            {/* // witch chat */}
            {/* {Object.keys(characterData.witch).includes(role) && (
                <NightChatRoom
                  nightTimeChat={nightTimeChat}
                  message={message}
                  setMessage={setMessage}
                  handleMessageSent={handleMessageSent}
                  playersData={playersData}
                  position={position}
                  role={role}
                />
              )} */}
            {/* // alive player can only see the day chat */}
            {/* {!playersData[position].alive && (
                <WholeDayChatRoom
                  deadChat={deadPlayerChat}
                  message={message}
                  setMessage={setMessage}
                  handleMessageSent={handleDeadPlayerMessageSent}
                  role={role}
                  playersData={playersData}
                  position={position}
                />
              )} */}
            {/* // medium can only see the dead chat */}
            {/* {role === "medium" && playersData[position].alive && (
                <WholeDayChatRoom
                  deadChat={deadPlayerChat}
                  message={message}
                  setMessage={setMessage}
                  handleMessageSent={handleDeadPlayerMessageSent}
                  role={role}
                  playersData={playersData}
                  position={position}
                />
              )} */}
          </div>
        </div>
        <div className="border-2 border-red-300 w-1/2 flex flex-col items-center justify-center">
          <div className="flex flex-col h-full w-full">
            <div className="h-[5%]">
              <div className="text-3xl font-semibold text-center">{timer}</div>
              <div className="text-xl font-bold text-center">
                {changeLanguage ? `Night: ${nights} ` : `夜晚: 第${nights}日 `}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center h-[95%] pb-[64px]">
              {playersData[position].role === "twistedFate" && (
                <div>
                  <select
                    value={twistedFateTarget}
                    onChange={(ev) => setTwistedFateTarget(ev.target.value)}
                    className="bg-gray-700"
                  >
                    <option className="bg-gray-700">{changeLanguage ? "Select a Role" : "選擇一名角色"}</option>
                    {twistedFateDropDownList.map((role) => (
                      <option value={role.roleName} key={role.roleName} className="bg-gray-700">
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetRef &&
                currAction &&
                !playersData[position].jailed &&
                playersData[position].role !== "joker" &&
                !!canShoot && (
                  <div className="text-2xl mt-4 transition-all duration-500 ease-in-out fade-in" key={target}>
                    <span>
                      {changeLanguage ? (
                        <>{`You decide to ${actionRef.current}`}</>
                      ) : (
                        <>{`你選擇了 ${actionRef.current}`}</>
                      )}
                      <span className="font-semibold text-rose-600 ml-2">
                        {target === null ? (changeLanguage ? "no one" : " ") : playersData[target].name}
                      </span>
                    </span>
                  </div>
                )}
              {playersData[position].role === "joker" && playersData[position].votedOut === true && (
                <div className="text-2xl mt-4 transition-all duration-500 ease-in-out fade-in" key={target}>
                  {`You decide to ${actionRef.current} ${
                    target === null ? (changeLanguage ? "no one" : " ") : playersData[target].name
                  }`}
                </div>
              )}
              {playersData[position].jailed && (
                <div className="text-2xl mt-4 transition-all duration-500 ease-in-out fade-in" key="jailed">
                  {changeLanguage ? "You have been jailed" : "你今晚已被人囚禁"}
                </div>
              )}
              {!canShoot && (
                <div className="text-2xl mt-4 transition-all duration-500 ease-in-out fade-in">
                  {changeLanguage
                    ? " You shot an innocent person thus lost the ability to shoot"
                    : "你因對市民開槍，所以你被沒收了槍"}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="border-2 border-red-300 w-1/4 h-full flex flex-col justify-between p-2 rounded-lg shadow-md">
          {/* <div className="h-1/2"> */}
          {/* <div className="bg-gray-600 text-lg mt-1 mb-4 text-center text-white font-bold py-2 rounded-md">{role}</div> */}

          <RoleCard playersData={playersData} position={position} />
          {/* </div> */}
          <div className="h-1/2">
            <AliveChatAndTarget
              playersData={playersData}
              position={position}
              setTarget={setTarget}
              day={day}
              cupidAbilityUsed={cupidAbilityUsed}
              canShoot={canShoot}
              initialVampire={initialVampire}
              target={target}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
