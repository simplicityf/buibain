import { Clock } from "lucide-react";

const ClockedAlt = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <Clock className="h-16 w-16 mx-auto text-button animate-pulse" />
        <h1 className="text-3xl font-primary font-semibold bg-gradient-to-r from-button to-primary2 bg-clip-text text-transparent">
          You're Not Clocked In
        </h1>
        <p className="text-text2 font-secondary text-lg">
          Please clock in to start your shift
        </p>
      </div>
    </div>
  );
};

export default ClockedAlt;
