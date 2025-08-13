import axios from "axios";
import dotenv from "dotenv"
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

export async function sendTelegramMessage(text: string) {
    try {
        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text,
            parse_mode: "HTML"
        });
        console.log("Telegram message sent:", response.data);
    } catch (error) {
        console.error("Error sending Telegram message:", error);
    }
}