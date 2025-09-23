import useHttpClient from "../api/useHttpClient";
import {
  ADD_PRODUCT,
  DELETE_PRODUCT,
  GET_MAIN_PRODUCT_DASHBOARD_DATA,
  GET_PRODUCTS_BY_CATEGORY,
  GET_PRODUCT_DASHBOARD_DATA,
  GET_SELLER_PRODUCTS,
  UPDATE_PRODUCT,
} from "../../constants/apiEndpoints";
import { useDispatch, useSelector } from "react-redux";
import { addProductData } from "../../redux/actions";

const useProducts = () => {
  const { sendRequest, sendAuthorizedRequest, isLoading, setIsLoading } =
    useHttpClient();
  const dispatch = useDispatch();
  const productData = useSelector((state) => state.productReducer);

  // Default safe response shape for category fetches
  const emptyCategoryResult = {
    deliverableProducts: [],
    nonDeliverableProducts: [],
    hasMore: false,
  };

  // Helper: ensure we have FormData (if passed plain object -> convert)
  const ensureFormData = (input) => {
    if (!input) return new FormData();

    if (typeof FormData !== "undefined" && input instanceof FormData) {
      return input;
    }

    const fd = new FormData();

    // If caller already passed a File or FormData-like object, handle keys manually
    Object.entries(input).forEach(([key, val]) => {
      if (val === undefined || val === null) return;

      // image: can be File object or URL string
      if (key === "image") {
        // File object
        if (typeof File !== "undefined" && val instanceof File) {
          fd.append("image", val);
        } else {
          // string url or base64 etc.
          fd.append("image", val);
        }
        return;
      }

      // If location object -> send JSON string (server expects JSON parse)
      if (key === "location") {
        try {
          fd.append("location", JSON.stringify(val));
        } catch (e) {
          // fallback: append as string
          fd.append("location", String(val));
        }
        return;
      }

      // Arrays -> append as JSON
      if (Array.isArray(val) || typeof val === "object") {
        fd.append(key, JSON.stringify(val));
        return;
      }

      // primitives
      fd.append(key, String(val));
    });

    return fd;
  };

  const getProductsByCategory = async (category, page, products_per_page, lng, lat) => {
    setIsLoading(true);
    try {
      const resp = await sendRequest(
        GET_PRODUCTS_BY_CATEGORY(category, page, products_per_page, lng, lat)
      );
      const body = resp?.data ?? resp ?? null;
      if (!body) return emptyCategoryResult;
      return body;
    } catch (error) {
      console.error("getProductsByCategory error:", error);
      return emptyCategoryResult;
    } finally {
      setIsLoading(false);
    }
  };

  const getProductUserDashboardData = async (productId) => {
    setIsLoading(true);
    try {
      const resp = await sendRequest(GET_PRODUCT_DASHBOARD_DATA(productId));
      const body = resp?.data ?? resp ?? null;
      return body ?? null;
    } catch (error) {
      console.error("getProductUserDashboardData error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getSellerProducts = async () => {
    setIsLoading(true);
    try {
      const resp = await sendAuthorizedRequest("seller", GET_SELLER_PRODUCTS, "GET");
      const body = resp?.data ?? resp ?? null;
      return body ?? [];
    } catch (error) {
      console.error("getSellerProducts error:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (productId, formData) => {
    setIsLoading(true);
    try {
      const payload = ensureFormData(formData);
      // Do NOT set Content-Type manually; let the browser set boundary header.
      const resp = await sendAuthorizedRequest(
        "seller",
        UPDATE_PRODUCT(productId),
        "PUT",
        payload,
        {} // no Content-Type header here
      );
      return resp?.data ?? resp ?? null;
    } catch (error) {
      console.error("updateProduct error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (formData) => {
    setIsLoading(true);
    try {
      const payload = ensureFormData(formData);
      const resp = await sendAuthorizedRequest(
        "seller",
        ADD_PRODUCT,
        "POST",
        payload,
        {} // do not set Content-Type manually
      );
      return resp?.data ?? resp ?? null;
    } catch (error) {
      console.error("addProduct error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    setIsLoading(true);
    try {
      const resp = await sendAuthorizedRequest(
        "seller",
        DELETE_PRODUCT(productId),
        "DELETE"
      );
      return resp?.data ?? resp ?? null;
    } catch (error) {
      console.error("deleteProduct error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getMainProductData = async (productId) => {
    setIsLoading(true);
    try {
      const resp = await sendRequest(GET_MAIN_PRODUCT_DASHBOARD_DATA(productId));
      const body = resp?.data ?? resp ?? null;

      if (body) {
        dispatch(
          addProductData({
            ...productData,
            ...body,
          })
        );
      }
      return body ?? null;
    } catch (error) {
      console.error("getMainProductData error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getProductsByCategory,
    getProductUserDashboardData,
    getSellerProducts,
    updateProduct,
    addProduct,
    deleteProduct,
    getMainProductData,
    isLoading,
    setIsLoading,
  };
};

export default useProducts;
