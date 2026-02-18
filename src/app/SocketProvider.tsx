import { useEffect } from "react";
import { socket } from "../socket";

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const userId = localStorage.getItem("zatchat-user-id");
    if (!userId) return;

    socket.io.opts.query = { userId };
    socket.connect();

    console.log("🟢 Socket connected globally");

    return () => {
      socket.disconnect();
      console.log("🔴 Socket disconnected globally");
    };
  }, []);

  return <>{children}</>;
}
