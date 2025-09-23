import React, { useEffect, useState } from "react";
import ProductCard from "../../components/products/ProductCard";
import { useParams } from "react-router-dom";
import ProductSkeleton from "../../components/skeleton/ProductSkeleton";
import EmptyStateText from "../../components/empty_state/EmptyStateText";
import useProducts from "../../hooks/products/useProducts";
import { removeAllProductfromCart, setUserLocation } from "../../redux/actions";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentLocation } from "../../utils/helper/getCurrentLocation";
import NavItem from "../../components/seller_dashboard/NavItem";
import { FaLocationCrosshairs } from "react-icons/fa6";
import LeafletMap from "../../components/map/LeafletMap";
import { RxCross2 } from "react-icons/rx";

function Product() {
  const { type } = useParams();
  const products_per_page = 50;

  const [deliverableProductData, setDeliverableProductData] = useState([]);
  const [nonDeliverableProductData, setNonDeliverableProductData] = useState([]);
  const [page, setPage] = useState(1); // start from page 1
  const [isLoadingProducts, setIsLoadingProducts] = useState(false); // local loading guard

  const userLocation = useSelector((state) => state.userLocationReducer);

  // note: the variable name kept as in your original code (selectedLatitute)
  const [selectedLatitute, setSelectedLatitute] = useState(userLocation[1] || 20.59);
  const [selectedLongitude, setSelectedLongitude] = useState(userLocation[0] || 78.96);

  const [showMap, setShowMap] = useState(false);
  const dispatch = useDispatch();

  const { getProductsByCategory, isLoading } = useProducts();

  const [isReachingEnd, setIsReachingEnd] = useState(false);

  // ---- helpers ----
  // normalize id from various shapes (string, ObjectId, { $oid: "..." })
  const getId = (item) => {
    if (!item) return "";
    if (typeof item._id === "string") return item._id;
    if (item._id && typeof item._id === "object") {
      if (item._id.$oid) return String(item._id.$oid);
      if (item._id.toString) return String(item._id.toString());
    }
    // fallback: some API may return id field
    if (item.id) return String(item.id);
    return "";
  };

  // dedupe array by id (preserve last occurrence)
  const uniqById = (arr) => {
    const map = new Map();
    for (const it of arr) {
      const id = getId(it) || Math.random().toString(36).slice(2); // fallback
      map.set(id, it);
    }
    return Array.from(map.values());
  };

  // merge previous + incoming while deduping (incoming overwrites prev)
  const mergeAndDedupe = (prevArr, incomingArr) => {
    // preserve order: prev first then incoming override duplicates by id
    const map = new Map();
    for (const it of prevArr) {
      const id = getId(it) || Math.random().toString(36).slice(2);
      map.set(id, it);
    }
    for (const it of incomingArr) {
      const id = getId(it) || Math.random().toString(36).slice(2);
      map.set(id, it); // incoming overrides
    }
    return Array.from(map.values());
  };

  // ---- effects ----

  // get user's location on mount and store in redux. If location fails, clear cart.
  useEffect(() => {
    const getLocInfo = async () => {
      try {
        const userCoordinates = await getCurrentLocation();
        // userCoordinates should be [lng, lat] in your app
        dispatch(setUserLocation(userCoordinates));
      } catch (err) {
        dispatch(removeAllProductfromCart());
      }
    };
    getLocInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Core fetch function (defensive)
  const getProductData = async () => {
    // guards: don't fetch if already loading, no more pages, or coords missing
    if (isLoadingProducts || isReachingEnd || !selectedLatitute || !selectedLongitude) return;

    setIsLoadingProducts(true);
    try {
      // getProductsByCategory may return axios response or raw body
      const resp = await getProductsByCategory(
        type,
        page,
        products_per_page,
        selectedLongitude,
        selectedLatitute
      );

      // normalize body (axios puts data in resp.data)
      const body = resp && resp.data ? resp.data : resp;

      // debug: log raw API body
      console.log("DEBUG getProductsByCategory body:", body);

      if (!body) {
        console.warn("getProductData: API returned empty body. Skipping update.");
        return;
      }

      const deliverableProductDetails = Array.isArray(body.deliverableProducts)
        ? body.deliverableProducts
        : [];
      const nonDeliverableProductDetails = Array.isArray(body.nonDeliverableProducts)
        ? body.nonDeliverableProducts
        : [];
      const hasMoreFlag = !!body.hasMore;

      // remove any non-deliverable that are present in deliverable (by id)
      const deliverableIds = new Set(deliverableProductDetails.map((p) => getId(p)));
      const filteredNonDeliverables = nonDeliverableProductDetails.filter(
        (p) => !deliverableIds.has(getId(p))
      );

      // merge and dedupe with existing state; incoming items override previous entries
      setDeliverableProductData((prev) => {
        const merged = mergeAndDedupe(prev, deliverableProductDetails);
        return uniqById(merged);
      });

      setNonDeliverableProductData((prev) => {
        // also make sure items in nonDeliverable are not in deliverable (existing or incoming)
        const currentDeliverableIds = new Set([
          ...deliverableProductDetails.map((p) => getId(p)),
          ...deliverableProductData.map((p) => getId(p)),
        ]);
        const cleanedPrev = prev.filter((p) => !currentDeliverableIds.has(getId(p)));
        const merged = mergeAndDedupe(cleanedPrev, filteredNonDeliverables);
        // final dedupe
        return uniqById(merged);
      });

      setIsReachingEnd(!hasMoreFlag);

      // increment page for next fetch
      setPage((prev) => prev + 1);
    } catch (err) {
      console.error("getProductData error:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // fetchData wrapper (keeps naming consistent with your code)
  const fetchData = async () => {
    await getProductData();
  };


  useEffect(() => {
    if (page >= 1 && !isReachingEnd) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isReachingEnd]);

  // reset & fetch fresh when userLocation changes
  useEffect(() => {
    // clear product lists and reset paging
    setDeliverableProductData([]);
    setNonDeliverableProductData([]);
    // reset page to 1 and then fetch first page by calling getProductData directly
    setPage(1);
    setIsReachingEnd(false);

    // fetch first page for new location
    (async () => {
      await Promise.resolve(); // allow state to flush
      await getProductData();
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // UI
  return (
    <>
      <div className="grid gap-4 md:gap-8 my-6 md:my-12 grid-cols-2 lg:grid-cols-4 w-11/12 mx-auto">
        {deliverableProductData &&
          deliverableProductData.length > 0 &&
          deliverableProductData.map((data, index) => {
            const stableId = getId(data) || `deliver-fallback-${index}`;
            return <ProductCard data={data} key={`deliver-${stableId}`} addOverlay={false} />;
          })}

        {nonDeliverableProductData &&
          nonDeliverableProductData.length > 0 &&
          nonDeliverableProductData.map((data, index) => {
            const stableId = getId(data) || `nondeliver-fallback-${index}`;
            return <ProductCard data={data} key={`nondeliver-${stableId}`} addOverlay={true} />;
          })}

        {/* Show skeleton during fetch (local or global loading) */}
        {(isLoadingProducts || isLoading) && <ProductSkeleton noOfBoxes={products_per_page} />}
      </div>

      {!isLoadingProducts && isReachingEnd && (
        <EmptyStateText
          marginY={"my-12"}
          text="Oops! It seems like you have reached at the end of the page in this category. Check back later or explore other categories to find what you're looking for!"
        />
      )}

      <NavItem
        text={"Choose Location"}
        icon={<FaLocationCrosshairs />}
        isSelected={true}
        className={"fixed bottom-0 left-0 mb-2 ml-2 z-20 rounded-full"}
        onClick={() => {
          setShowMap(true);
        }}
      />

      {showMap && (
        <div className="mx-auto w-screen h-full fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] z-30 flex justify-center items-center">
          <div className="absolute opacity-90 bg-black z-30 w-full h-full" />

          <div className="z-40 w-11/12 h-[90%] relative">
            <div
              className="absolute bg-red-900 p-2 text-xl rounded-sm right-0 top-0 z-[999] m-2 cursor-pointer text-white"
              onClick={() => {
                setShowMap(false);
              }}
            >
              <RxCross2 />
            </div>

            <div className="absolute bg-red-900 px-3 py-1.5 text-sm font-medium rounded-sm right-0 bottom-0 z-[999] m-2 cursor-pointer text-white">
              {selectedLatitute.toFixed(2)}, {selectedLongitude.toFixed(2)}
            </div>

            <div className="absolute text-red-700 px-3 py-1.5 text-xs font-medium rounded-sm left-[50%] -translate-x-[50%] bottom-0 z-[999] m-2">
              Red Marker: Your Location
            </div>

            <button
              className="absolute bg-red-900 px-3 py-1.5 font-medium text-sm rounded-sm left-0 bottom-0 z-[999] m-2 cursor-pointer text-white"
              onClick={() => {
                setShowMap(false);
                dispatch(setUserLocation([selectedLongitude, selectedLatitute]));
              }}
            >
              Select Location
            </button>

            <LeafletMap
              showSearchBox={true}
              latitude={selectedLatitute}
              longitude={selectedLongitude}
              width="w-full"
              height="h-full"
              setLatitude={setSelectedLatitute}
              setLongitude={setSelectedLongitude}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Product;
