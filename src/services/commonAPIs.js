import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Config from 'react-native-config';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';

const instance = axios.create({
  baseURL: Config.BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json',
  },
});

export const clearAuthToken = async () => {
  try {
    // 1. Remove auth token from persistent local storage
    await AsyncStorage.removeItem('Token');

    // 2. Remove token from global Axios headers (if using Axios)
    delete axios.defaults.headers.common['Authorization'];

    return true;
  } catch (error) {
    console.error('Error clearing auth token:', error);
    throw error;
  }
};
export const setAuthToken = async (token)=> {
  try {
    if (token) {
      await AsyncStorage.setItem('Token', token);
    }
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

export const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('Token');
    return token;
  } catch (error) {
    return null;
  }
};
export const getUserId = async () => {
  try {
    const userId = await AsyncStorage.getItem('id');
    return userId;
  } catch (error) {
    return null;
  }
};
export const getUserDetail = async () => {
  try {
    const userDetail = await AsyncStorage.getItem('userDetail');
    return JSON.parse(userDetail);
  } catch (error) {
    return null;
  }
};
export const getApi = async (url, onSuccess, onError, params = {}) => {
  instance.defaults.baseURL = Config.BASE_URL;
  const authToken = await getAuthToken();
  const config = {
    headers: {},
    params: params,
  };

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  instance
    .get(url, config)
    .then(function (response) {
      onSuccess(response.data);
    })
    .catch(function (error) {
      onError(error);
    });
};

export const postApi = async (url, params, onSuccess, onError) => {
  instance.defaults.baseURL = Config.BASE_URL;
 
  const authToken = await getAuthToken();
  const config = {
    headers: {},
  };
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  instance
    .post(url, params, config)
    .then(function (response) {
      onSuccess(response.data);
    })
    .catch(function (error) {
      onError(error);
    });
};

export const putApi = async (url, params, onSuccess, onError) => {
  instance.defaults.baseURL = Config.BASE_URL;
  const authToken = await getAuthToken();

  instance
    .put(url, params, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    .then(function (response) {
      onSuccess(response.data);
    })
    .catch(function (error) {
      onError(error);
    });
};

export const deleteApi = async (url, id, onSuccess, onError) => {
  const fullUrl = `${url}/${id}`;

  instance.defaults.baseURL = Config.BASE_URL;
  const authToken = await getAuthToken();

  let headers = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  instance
    .delete(fullUrl, {headers})
    .then(function (response) {
      onSuccess(response.data);
    })
    .catch(function (error) {
      onError(error);
    });
};

export const searchApi = async (url, params, onSuccess, onError) => {
  const query = new URLSearchParams(params).toString();
  const fullUrl = `${url}?${query}`;
  instance.defaults.baseURL = Config.BASE_URL;
  const authToken = await getAuthToken();

  let headers = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  instance
    .get(fullUrl, {headers})
    .then(function (response) {
      onSuccess(response.data);
    })
    .catch(function (error) {
      onError(error);
    });
};


export const postApiFormData = async (url, params, onSuccess, onError) => {
  instance.defaults.baseURL = Config.BASE_URL;
  const authToken = await getAuthToken();
  const config = {
    headers: {
    'Content-Type': 'multipart/form-data',
     timeout: 30000,
    },
  };
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  instance
    .post(url, params, config)
    .then(function (response) {
      onSuccess(response.data);
    })
    .catch(function (error) {
      onError(error);
    });
};

export const putApiFormData = async (url, params, onSuccess, onError) => {
  instance.defaults.baseURL = Config.BASE_URL;
  const authToken = await getAuthToken();
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  instance
    .put(url, params, config)
    .then(function (response) {
      onSuccess(response.data);
    })
    .catch(function (error) {
      onError(error);
    });
};


export const downloadFileApi = async (url, fileName, onSuccess, onError, params = {}) => {
  try {
    const authToken = await getAuthToken();
    
    // Convert params object to query string (e.g., ?year=2023)
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${Config.BASE_URL}${url}${queryString ? `?${queryString}` : ''}`;
    
    const { config, fs } = ReactNativeBlobUtil;
    const downloadDir = Platform.OS === 'ios' ? fs.dirs.DocumentDir : fs.dirs.DownloadDir;

    config({
      fileCache: true,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        path: `${downloadDir}/${fileName}`,
        description: 'Downloading archive...',
        mime: 'application/zip',
        mediaScannable: true,
      },
    })
      .fetch('GET', fullUrl, {
        Authorization: `Bearer ${authToken}`,
      })
      .then((res) => {
        if (res.respInfo.status === 200) {
          if (Platform.OS === 'ios') ReactNativeBlobUtil.ios.previewDocument(res.path());
          onSuccess(res.path());
        } else {
          onError(new Error("Download failed"));
        }
      })
      .catch((err) => onError(err));
  } catch (error) {
    onError(error);
  }
};
export const appendFile = (file) => {
  // If it's a PDF from a document picker, it will have a different type
  return {
    uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
    type: file.type || "image/jpeg", // Will be 'application/pdf' for PDFs
    name: file.name || file.fileName || `file_${Date.now()}.${file.type === 'application/pdf' ? 'pdf' : 'jpg'}`,
  };
};
