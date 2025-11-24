
import React from "react";

export const BackgroundBeams: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
      <div className="absolute inset-0 bg-slate-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="absolute w-[1000px] h-[1000px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          style={{
            transformOrigin: "center",
            opacity: 0.1,
            animation: "beam-spin 20s linear infinite",
            background: "conic-gradient(from 90deg at 50% 50%, #1d4ed8 0%, #3b82f6 50%, #1d4ed8 100%)",
          }}
          className="w-full h-full"
        />
      </div>
       <style>{`
        @keyframes beam-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
