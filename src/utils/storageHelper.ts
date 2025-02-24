export const safeJsonParse = (data: string | null): any => {
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
};

export const safeJsonStringify = (data: any): string => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to stringify object:', error);
    return '{}';
  }
};
