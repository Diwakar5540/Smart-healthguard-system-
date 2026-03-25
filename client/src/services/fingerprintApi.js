import axios from 'axios';

export const lookupBloodGroup = async (fingerprintId) => {
  const response = await axios.post(
    '/api/fingerprint/lookup',
    { fingerprintId },
    { withCredentials: true }
  );
  return response.data;
};
