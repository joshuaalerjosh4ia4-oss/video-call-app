-- Remove legacy direct-call persistence. Room membership is the only calling model.
DROP TABLE "calls";
DROP TYPE "CallStatus";
