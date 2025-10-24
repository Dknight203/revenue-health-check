import { AIAnalysisResult, LeadData } from "@/types/analyzer";

const QUEUE_KEY = "webhook_queue";

interface QueuedWebhook {
  id: string;
  result: AIAnalysisResult;
  lead: LeadData;
  timestamp: string;
  attempts: number;
}

export function addToWebhookQueue(result: AIAnalysisResult, lead: LeadData) {
  try {
    const queue = getWebhookQueue();
    const newItem: QueuedWebhook = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      result,
      lead,
      timestamp: new Date().toISOString(),
      attempts: 0
    };
    queue.push(newItem);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to add to webhook queue:", error);
  }
}

export function getWebhookQueue(): QueuedWebhook[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function removeFromWebhookQueue(id: string) {
  try {
    const queue = getWebhookQueue();
    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove from webhook queue:", error);
  }
}

export function incrementQueueAttempts(id: string) {
  try {
    const queue = getWebhookQueue();
    const updated = queue.map(item => 
      item.id === id ? { ...item, attempts: item.attempts + 1 } : item
    );
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to increment queue attempts:", error);
  }
}

export function clearWebhookQueue() {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error("Failed to clear webhook queue:", error);
  }
}
