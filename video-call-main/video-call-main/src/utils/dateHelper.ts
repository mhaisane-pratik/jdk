// File: video-call-main/src/utils/dateHelper.ts

export function formatMessageDate(dateString: string): string {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  messageDate.setHours(0, 0, 0, 0);

  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    // Format as "January 15, 2024"
    return messageDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function groupMessagesByDate(messages: any[]) {
  const grouped: { [key: string]: any[] } = {};

  messages.forEach((message) => {
    const dateLabel = formatMessageDate(message.created_at);
    
    if (!grouped[dateLabel]) {
      grouped[dateLabel] = [];
    }
    
    grouped[dateLabel].push(message);
  });

  return grouped;
}