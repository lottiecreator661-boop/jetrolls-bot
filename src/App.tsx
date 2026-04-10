import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// === ТВОИ КЛЮЧИ SUPABASE УЖЕ ТУТ ===
const SUPABASE_URL = "https://nnlgwfdctzipqcuryrid.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0jUslQ3QTWUmdkn172wHrw_IlrF7MDj";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

declare global {
  interface Window {
    Telegram: any;
  }
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [balance, setBalance] = useState(5000);
  const [bet, setBet] = useState(10);
  const [chance, setChance] = useState(40);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState<"game" | "profile">("game");
  const [isTurbo, setIsTurbo] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ wagered: 0, profit: 0, wins: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  const audioCtx = useRef<AudioContext | null>(null);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ПОДКЛЮЧЕНИЕ К БАЗЕ ПРИ СТАРТЕ
  useEffect(() => {
    const init = async () => {
      const tg = window.Telegram?.WebApp;
      const id = tg?.initDataUnsafe?.user?.id || 12345678;
      setTelegramId(id);

      let { data, error } = await supabase
        .from("profile_stats")
        .select("*")
        .eq("id", id)
        .single();

      if (error && error.code === "PGRST116") {
        const { data: newUser } = await supabase
          .from("profile_stats")
          .insert([{ id, balance: 5000 }])
          .select()
          .single();
        data = newUser;
      }

      if (data) {
        setBalance(data.balance);
        setStats({
          wagered: data.wagered,
          profit: data.profit,
          wins: data.wins,
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  const saveToCloud = async (newBal: number, newStats: any) => {
    if (!telegramId) return;
    await supabase
      .from("profile_stats")
      .update({
        balance: newBal,
        wagered: newStats.wagered,
        wins: newStats.wins,
        profit: newStats.profit,
      })
      .eq("id", telegramId);
  };

  const multiplier = ((100 / chance) * 0.9).toFixed(2);
  const winAmount = (bet * parseFloat(multiplier)).toFixed(2);
  const sectorDeg = (chance / 100) * 360;
  const spinDuration = isTurbo ? 400 : 2500;
  const color = `rgb(${
    chance < 50 ? 255 : Math.floor(255 - (chance - 50) * 5.1)
  }, ${chance < 50 ? Math.floor(chance * 5.1) : 255}, 0)`;

  const play = () => {
    if (isSpinning || balance < bet || bet <= 0) {
      setIsAuto(false);
      return;
    }
    setIsSpinning(true);
    setBalance((prev) => prev - bet);

    const randomPoint = Math.random() * 360;
    const isWin = randomPoint <= sectorDeg;
    const nextRotation =
      rotation +
      (isTurbo ? 720 : 2160) +
      (360 - (rotation % 360)) +
      (360 - randomPoint);
    setRotation(nextRotation);

    setTimeout(() => {
      let finalBal = balance - bet;
      let finalStats = { ...stats, wagered: stats.wagered + bet };

      if (isWin) {
        finalBal += parseFloat(winAmount);
        finalStats.wins += 1;
        finalStats.profit += parseFloat(winAmount) - bet;
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        finalStats.profit -= bet;
      }

      setBalance(finalBal);
      setStats(finalStats);
      setIsSpinning(false);
      saveToCloud(finalBal, finalStats);
      setHistory((prev) =>
        [
          {
            id: Date.now(),
            isWin,
            profit: isWin ? parseFloat(winAmount) - bet : -bet,
          },
          ...prev,
        ].slice(0, 5)
      );
    }, spinDuration);
  };

  useEffect(() => {
    if (isAuto && !isSpinning) autoTimerRef.current = setTimeout(play, 500);
    return () => clearTimeout(autoTimerRef.current!);
  }, [isAuto, isSpinning]);

  if (loading)
    return (
      <div
        style={{
          background: "#0b0e14",
          height: "100vh",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ЗАГРУЗКА БАЗЫ...
      </div>
    );

  return (
    <div
      style={{
        backgroundColor: "#0b0e14",
        minHeight: "100vh",
        color: "white",
        fontFamily: "system-ui",
        paddingBottom: "90px",
        userSelect: "none",
      }}
    >
      <div
        style={{ padding: "20px", display: "flex", justifyContent: "center" }}
      >
        <div
          style={{
            background: "#1a1d26",
            padding: "14px 28px",
            borderRadius: "18px",
            border: "1px solid #1f2937",
          }}
        >
          <span style={{ fontWeight: "900", fontSize: "22px" }}>
            💎 {balance.toLocaleString()}{" "}
            <span style={{ fontSize: "14px", color: "#3b82f6" }}>TON</span>
          </span>
        </div>
      </div>

      {activeTab === "game" ? (
        <div style={{ padding: "0 20px", maxWidth: "450px", margin: "0 auto" }}>
          <div
            style={{
              position: "relative",
              width: "250px",
              height: "250px",
              margin: "20px auto",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-15px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                width: 0,
                height: 0,
                borderLeft: "15px solid transparent",
                borderRight: "15px solid transparent",
                borderTop: "25px solid #fff",
              }}
            />
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                border: "10px solid #1c1f26",
                transition: isSpinning
                  ? `transform ${spinDuration}ms cubic-bezier(0.1, 0, 0.1, 1)`
                  : "none",
                transform: `rotate(${rotation}deg)`,
                background: `conic-gradient(${color} 0deg ${sectorDeg}deg, #11131a ${sectorDeg}deg 360deg)`,
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              background: "#1a1d26",
              padding: "15px",
              borderRadius: "14px",
              marginBottom: "20px",
              border: "1px solid #1f2937",
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ color: "#6b7280", fontSize: "10px" }}>ШАНС</div>
              <div style={{ fontWeight: "bold", color }}>{chance}%</div>
            </div>
            <div>
              <div style={{ color: "#6b7280", fontSize: "10px" }}>
                МНОЖИТЕЛЬ
              </div>
              <b>x{multiplier}</b>
            </div>
            <div>
              <div style={{ color: "#6b7280", fontSize: "10px" }}>ВЫПЛАТА</div>
              <b>{winAmount}</b>
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="95"
            value={chance}
            onChange={(e) => !isSpinning && setChance(Number(e.target.value))}
            style={{ width: "100%", accentColor: color, marginBottom: "20px" }}
          />

          <input
            type="number"
            value={bet}
            onChange={(e) =>
              setBet(
                Math.min(balance, Math.max(0, parseFloat(e.target.value) || 0))
              )
            }
            style={{
              width: "100%",
              background: "#1a1d26",
              border: "1px solid #1f2937",
              color: "white",
              padding: "15px",
              borderRadius: "12px",
              fontSize: "18px",
              textAlign: "center",
              marginBottom: "15px",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <button
              onClick={() => setBet((b) => Math.max(1, Math.floor(b / 2)))}
              style={btnStyle}
            >
              1/2
            </button>
            <button
              onClick={() => setBet((b) => Math.min(balance, b * 2))}
              style={btnStyle}
            >
              x2
            </button>
            <button
              onClick={() => setBet((b) => Math.min(balance, b + 10))}
              style={btnStyle}
            >
              +10
            </button>
            <button onClick={() => setBet(balance)} style={btnStyle}>
              MAX
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button
              onClick={() => setIsTurbo(!isTurbo)}
              style={{
                ...toggleStyle,
                color: isTurbo ? "#f97316" : "#6b7280",
                borderColor: isTurbo ? "#f97316" : "#1f2937",
              }}
            >
              {isTurbo ? "🔥 ТУРБО" : "НОРМАЛ"}
            </button>
            <button
              onClick={() => setIsAuto(!isAuto)}
              style={{
                ...toggleStyle,
                color: isAuto ? "#3b82f6" : "#6b7280",
                borderColor: isAuto ? "#3b82f6" : "#1f2937",
              }}
            >
              {isAuto ? "🔄 АВТО ON" : "АВТО OFF"}
            </button>
          </div>

          <button
            onClick={play}
            disabled={isSpinning}
            style={{
              width: "100%",
              padding: "20px",
              borderRadius: "18px",
              border: "none",
              background: isSpinning ? "#1f2937" : color,
              color: "#000",
              fontSize: "18px",
              fontWeight: "900",
            }}
          >
            {isSpinning ? "УДАЧИ..." : `ИГРАТЬ ${bet} TON`}
          </button>
        </div>
      ) : (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "#1a1d26",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
              margin: "0 auto 20px",
              border: "2px solid #3b82f6",
            }}
          >
            👤
          </div>
          <h2>Профиль</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <div style={cardStyle}>
              <div style={{ fontSize: "10px", color: "#6b7280" }}>СТАВОК</div>
              <b>{stats.wagered.toFixed(2)}</b>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "10px", color: "#6b7280" }}>ПОБЕД</div>
              <b>{stats.wins}</b>
            </div>
            <div style={{ ...cardStyle, gridColumn: "span 2" }}>
              <div style={{ fontSize: "10px", color: "#6b7280" }}>ПРОФИТ</div>
              <b style={{ color: stats.profit >= 0 ? "#10b981" : "#ef4444" }}>
                {stats.profit.toFixed(2)} TON
              </b>
            </div>
          </div>
        </div>
      )}

      <div style={navStyle}>
        <div
          onClick={() => setActiveTab("game")}
          style={{ opacity: activeTab === "game" ? 1 : 0.4 }}
        >
          🎮
        </div>
        <div
          onClick={() => setActiveTab("profile")}
          style={{ opacity: activeTab === "profile" ? 1 : 0.4 }}
        >
          👤
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  background: "#1a1d26",
  border: "1px solid #1f2937",
  color: "white",
  padding: "10px",
  borderRadius: "12px",
  fontWeight: "bold",
};
const toggleStyle = {
  flex: 1,
  background: "#0b0e14",
  border: "1px solid",
  padding: "12px",
  borderRadius: "14px",
  fontWeight: "bold",
  fontSize: "11px",
};
const cardStyle = {
  background: "#1a1d26",
  padding: "20px",
  borderRadius: "18px",
  border: "1px solid #1f2937",
};
const navStyle = {
  position: "fixed",
  bottom: 0,
  width: "100%",
  height: "75px",
  background: "#11131a",
  borderTop: "1px solid #1f2937",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  fontSize: "24px",
};
