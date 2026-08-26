import axios from "axios";

/**
 * Search Xbox / Microsoft Store games (Vietnam region & Vietnamese locale)
 */
export async function searchXbox(query) {
  try {
    const url = `https://apps.microsoft.com/api/products/search?query=${encodeURIComponent(query)}&gl=VN&hl=vi-vn`;
    const response = await axios.get(url, {
      timeout: 6000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const products = response.data?.productsList || [];
    // Filter for games
    const games = products.filter((p) => p.isGame || p.productFamilyName === "Games" || p.typeTag === "app");

    return games.map((item) => {
      const cover = item.posterArtUrl || item.boxArtUrl || item.iconUrl || "";
      let price = 0;
      if (item.priceInfo && typeof item.priceInfo.price === "number") {
        price = item.priceInfo.price;
      } else if (typeof item.price === "number") {
        price = item.price;
      }

      return {
        id: item.productId,
        storeId: item.productId,
        storeType: "xbox",
        name: item.title,
        cover,
        thumbnail: item.iconUrl || item.boxArtUrl || cover,
        price,
        platform: "Xbox",
      };
    });
  } catch (error) {
    console.error("Xbox search error:", error.message);
    return [];
  }
}

/**
 * Get detailed Xbox game info via Display Catalog API & Microsoft Store
 */
export async function getXboxGameDetails(productId) {
  try {
    const catalogUrl = `https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${productId}&market=VN&languages=vi-vn`;
    const response = await axios.get(catalogUrl, {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const product = response.data?.Products?.[0];
    if (!product) {
      // Fallback to apps.microsoft.com search
      return await getXboxDetailsFallback(productId);
    }

    const locProps = product.LocalizedProperties?.[0] || {};
    const props = product.Properties || {};

    const title = locProps.ProductTitle || "Unknown Xbox Game";
    const studio = locProps.DeveloperName || "Unknown Studio";
    const publisher = locProps.PublisherName || studio;
    const description = locProps.ProductDescription || "";
    const category = props.Category || "Action";

    // Extract images
    const images = locProps.Images || [];
    const posterImg = images.find((img) => img.ImagePurpose === "Poster" || img.ImagePurpose === "BoxArt" || img.ImagePurpose === "FeaturePromotionalSquareArt")?.Uri;
    const cover = posterImg ? (posterImg.startsWith("http") ? posterImg : `https:${posterImg}`) : "";

    const rawScreenshots = images
      .filter((img) => img.ImagePurpose === "Screenshot" || img.ImagePurpose === "SuperHeroArt")
      .map((img) => (img.Uri.startsWith("http") ? img.Uri : `https:${img.Uri}`));
    const screenshots = Array.from(new Set(rawScreenshots));

    // Extract videos/trailers
    const rawVideos = locProps.Videos || [];
    const videos = rawVideos.map((v) => ({
      name: v.VideoPurpose || "Trailer",
      thumbnail: v.PreviewImage?.Uri ? (v.PreviewImage.Uri.startsWith("http") ? v.PreviewImage.Uri : `https:${v.PreviewImage.Uri}`) : "",
      url: v.Uri ? (v.Uri.startsWith("http") ? v.Uri : `https:${v.Uri}`) : "",
    })).filter((v) => !!v.url);

    // Release date
    const releaseDateStr = product.MarketProperties?.[0]?.OriginalReleaseDate || "";
    let releaseYear = new Date().getFullYear();
    let formattedReleaseDate = "TBA";
    if (releaseDateStr) {
      const d = new Date(releaseDateStr);
      if (!isNaN(d.getTime())) {
        releaseYear = d.getFullYear();
        formattedReleaseDate = d.toLocaleDateString("vi-VN", { year: "numeric", month: "short", day: "numeric" });
      }
    }

    // Price
    let price = 0;
    try {
      const sku = product.DisplaySkuAvailabilities?.[0]?.Availabilities?.[0]?.OrderManagementData?.Price;
      if (sku?.MSRP) {
        price = Math.round(sku.MSRP);
      }
    } catch {}

    const rawAttrs = (product.Properties?.Attributes || []).map((a) => (typeof a === "string" ? a : a?.Name)).filter(Boolean);
    const tags = Array.from(new Set([category, ...rawAttrs])).filter(Boolean);

    return {
      title,
      studio,
      publisher,
      genre: category,
      year: releaseYear,
      hours: 0,
      platform: "Xbox",
      cover,
      screenshots,
      videos,
      description,
      releaseDate: formattedReleaseDate,
      tags,
      price,
      storeId: String(productId),
      storeType: "xbox",
    };
  } catch (error) {
    console.error(`Xbox details error for ${productId}:`, error.message);
    return await getXboxDetailsFallback(productId);
  }
}

async function getXboxDetailsFallback(productId) {
  const searchUrl = `https://apps.microsoft.com/api/products/search?query=${encodeURIComponent(productId)}&gl=VN&hl=vi-vn`;
  const res = await axios.get(searchUrl, { timeout: 6000, headers: { "User-Agent": "Mozilla/5.0" } });
  const item = res.data?.productsList?.[0];
  if (!item) {
    throw new Error(`Xbox product not found: ${productId}`);
  }

  const cover = item.posterArtUrl || item.boxArtUrl || item.iconUrl || "";
  const screenshots = (item.screenshots || []).map((s) => s.url || s.Uri).filter(Boolean);
  let price = 0;
  if (item.priceInfo && typeof item.priceInfo.price === "number") {
    price = item.priceInfo.price;
  } else if (typeof item.price === "number") {
    price = item.price;
  }

  return {
    title: item.title,
    studio: item.publisherName || "Unknown Studio",
    publisher: item.publisherName || "Unknown Publisher",
    genre: item.categories?.[0] || "Action",
    year: item.releaseDateUtc ? new Date(item.releaseDateUtc).getFullYear() : new Date().getFullYear(),
    hours: 0,
    platform: "Xbox",
    cover,
    screenshots,
    videos: [],
    description: item.description || "",
    releaseDate: item.releaseDateUtc ? new Date(item.releaseDateUtc).toLocaleDateString("vi-VN") : "TBA",
    tags: item.categories || [],
    price,
    storeId: String(productId),
    storeType: "xbox",
  };
}
