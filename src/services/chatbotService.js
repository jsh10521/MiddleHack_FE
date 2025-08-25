// Gemini 기반 챗봇 서비스
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

class ChatbotService {
    constructor() {
        this.genAI = null;
        this.initializeAI();
    }

    initializeAI() {
        if (GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        }
    }

    async generateResponse(userMessage, location, places = []) {
        if (!this.genAI) {
            throw new Error('Gemini API 키가 없습니다. REACT_APP_GEMINI_API_KEY를 확인하세요.');
        }

        let placesText = '';
        if (Array.isArray(places) && places.length > 0) {
            placesText = '\n\n[주변 장소 추천]\n';
            places.slice(0, 3).forEach((p, i) => {
                placesText += `${i + 1}. ${p.name} (${p.address})\n`;
            });
        }

        const enhancedPrompt = `[시스템] 당신은 서울시 동대문구 지역 전문가입니다. 친근하고 실용적으로 답하세요.\n${
            location
                ? `사용자 위치(approx): 위도 ${location.latitude?.toFixed?.(4)}, 경도 ${location.longitude?.toFixed?.(
                      4
                  )}.`
                : ''
        }\n${placesText}\n사용자 질문: ${userMessage}`;

        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const result = await model.generateContent(enhancedPrompt);
        return result.response.text();
    }

    detectKeywords(message) {
        const keywords = ['맛집', '카페', '관광지', '식당', '호텔', '병원', '공원', '도서관', '쇼핑', '시장', '명소'];
        return keywords.find((kw) => message.includes(kw));
    }
}

export default new ChatbotService();
