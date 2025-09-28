import React, { useState } from "react";
import axios from "axios";
import { notify } from "../../utils/helper/notification";
import { notifyType } from "../../utils/helper/notificationType";
import { useCookies } from "react-cookie";

axios.defaults.baseURL = import.meta.env.VITE_AGROBRIDGE_API;
axios.defaults.withCredentials = true; // <<< send & accept cookies by default

const useHttpClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [cookies, setCookie] = useCookies([
    "user_access_token",
    "seller_access_token",
    "brandName",
  ]);

  const sendRequest = async (
    url,
    method = "GET",
    body = null,
    headers = {},
    showToast = true,
    withCredentials = true
  ) => {
    setIsLoading(true);
    try {
      const response = await axios({
        url,
        method,
        data: body,
        headers,
        withCredentials,
      });

      // Legacy: server returns cookie values in JSON -> persist them client-side (dev fallback)
      if (response?.data?.cookies) {
        Object.keys(response.data.cookies).forEach((cookieName) => {
          try {
            // store via react-cookie (available to JS)
            setCookie(cookieName, response.data.cookies[cookieName], {
              path: "/",
            });
          } catch (e) {
            console.warn("Could not set cookie via react-cookie:", e);
          }
        });
      }

      // Debugging help
      console.debug("[HTTP] Response:", url, response);

      if (showToast && response?.data?.message) {
        notify(response.data.message, "success");
      }

      return response; // return full axios response to keep backward compatibility
    } catch (error) {
      // Defensive: error.response may be undefined (network error)
      console.error("[HTTP] Error:", error);

      const status = error?.response?.status;

      if (status === 504) {
        notify(
          "Gateway timeout occurred. Please try to reload the page.",
          "error"
        );
        setIsLoading(false);
        return;
      }

      // if server returned a JSON error message, show it
      const serverMsg = error?.response?.data?.message;
      if (showToast && serverMsg) {
        notify(serverMsg, notifyType(status || 500));
      } else if (showToast) {
        notify("Something went wrong. Please try again.", "error");
      }

      // rethrow so callers can catch
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendAuthorizedRequest = async (
    requestType = "user",
    url,
    method = "GET",
    body = null,
    headers = {},
    showToast = true,
    withCredentials = true
  ) => {
    // Read token if available in cookies (this will be absent when backend uses httpOnly cookies)
    const token =
      requestType === "user" ? cookies.user_access_token : cookies.seller_access_token;

    const authHeader = token ? { authorization: `Bearer ${token}` } : {};

    try {
      return await sendRequest(
        url,
        method,
        body,
        {
          ...authHeader,
          ...headers,
        },
        showToast,
        withCredentials
      );
    } catch (error) {
      // if server returns 401/403, show friendly message
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        notify("Please login to continue", "info");
      }
      throw error;
    }
  };

  return { isLoading, sendRequest, sendAuthorizedRequest, setIsLoading };
};

export default useHttpClient;
