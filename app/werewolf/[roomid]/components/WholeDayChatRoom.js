function WholeDayChatRoom({
  message,
  setMessage,
  handleMessageSent,
  role,
  deadChat,
}) {
  return (
    <div className="mt-4">
      <input
        value={message}
        onChange={(ev) => setMessage(ev.target.value)}
        className="border-2 border-cyan-300"
        disabled={role === "medium"} // Disable input for medium role
      />
      <button
        onClick={handleMessageSent}
        className={`cursor-pointer ${
          role === "medium" ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={role === "medium"}
      >
        Send
      </button>
      <div className="mt-4">
        {deadChat.map((allDeadMessage, index) => (
          <div key={index}>
            {allDeadMessage.name}: {allDeadMessage.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WholeDayChatRoom;
