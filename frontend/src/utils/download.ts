const getFormattedDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

export const downloadFile = (
  content: string,
  filenamePrefix: 'extract' | 'match' | 'categorize',
  fileType: 'json' | 'md'
) => {
  const dateTime = getFormattedDateTime();
  const filename = `${filenamePrefix}_${dateTime}.${fileType}`;
  const mimeType = fileType === 'json' ? 'application/json' : 'text/markdown';
  const blob = new Blob([content], { type: mimeType });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(link.href);
};