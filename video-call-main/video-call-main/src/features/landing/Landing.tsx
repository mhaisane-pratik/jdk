import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate("/chat"); // or "/chat"
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      
      <div className="text-center space-y-6">
        
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white shadow-lg">
            <MessageCircle size={40} className="text-blue-600" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white">
          ZATCHAT
        </h1>

        <p className="text-white/80">
          Click below to start chatting
        </p>

        <button
          onClick={handleStartChat}
          className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:scale-105 transition"
        >
          🚀 Start Chat
        </button>

      </div>

    </div>
  );
};

export default Landing;