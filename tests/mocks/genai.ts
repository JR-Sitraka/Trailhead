import { vi, type MockedFunction } from "vitest";

export const genaiMock = {
  responseText: '{"status":"off_topic","answer":"Off topic.","citations":[]}',
  rejectStatus: null as number | null,
  rejectMessage: "",
};

export function setGenaiAnswer(text: string) {
  genaiMock.responseText = text;
  genaiMock.rejectStatus = null;
  genaiMock.rejectMessage = "";
}

export function setGenaiReject(status: number, message: string) {
  genaiMock.responseText = "";
  genaiMock.rejectStatus = status;
  genaiMock.rejectMessage = message;
}

export function resetGenaiMock() {
  genaiMock.responseText = '{"status":"off_topic","answer":"Off topic.","citations":[]}';
  genaiMock.rejectStatus = null;
  genaiMock.rejectMessage = "";
}

export const FakeGoogleGenAI: any = class FakeGoogleGenAI {
  constructor() {
    return {
      generateContent: async () => {
        if (genaiMock.rejectStatus !== null) {
          const err: any = new Error(genaiMock.rejectMessage);
          err.status = genaiMock.rejectStatus;
          throw err;
        }
        return { text: genaiMock.responseText };
      },
    };
  }
};
