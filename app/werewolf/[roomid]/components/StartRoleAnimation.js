import RoleCard from "./RoleCard";
const StartRoleAnimation = ({ playersData, position }) => {
  return (
    <div className="bg-gray-700 text-white h-3/4 w-3/4 flex flex-col justify-center items-center border-black border-2 rounded-lg">
      <RoleCard playersData={playersData} position={position} />
    </div>
  );
};

export default StartRoleAnimation;
