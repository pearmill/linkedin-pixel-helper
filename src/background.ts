self._linkedin_pixel_data = {}
const matchingUrls = ['<all_urls>']

const parseSearch = (search: string): LinkedInTagParams => {
  if (!search) return {}
  if (!search.length) return {}
  if (/^\?/.test(search)) {
    search = search.slice(1)
  }

  const params = search
    .split("&").map((keyVal) => (keyVal || '').split('='))
    .reduce((query: { [key: string]: string }, keyVal: string[]) => {
      query[keyVal[0]] = keyVal[1]
      return query
    }, {})

  return params
}

const setupTab = async (tabId: number) => {
  const data = await chrome.storage.local.get(`${tabId}`)
  if (!data || !data[`${tabId}`]) {
    const newTab = {
      insight_tags: [],
      pixels: []
    }

    chrome.storage.local.set({
      [tabId]: newTab,
      currentTabId: tabId
    })

    return newTab;
  }

  return data[`${tabId}`];
}

const updateBadge = async (tabId: number) => {
  const data = await chrome.storage.local.get(`${tabId}`)
  if (!data || !data[`${tabId}`]) return
  const tabData = data[`${tabId}`]

  chrome.action.setBadgeText({
    tabId,
    text: String(tabData.pixels.length + tabData.insight_tags.length)
  })
}

const addInsightTag = async (tabId: number, partnerId: string, status?: string) => {
  const currentTab = await setupTab(tabId)

  currentTab.insight_tags.push({
    partnerId,
    status: status ? status : 'pending'
  });

  return chrome.storage.local.set({
    [tabId]: currentTab
  })
}

const updateInsightTagStatus = async (tabId: number, partnerId: string, status: string) => {
  const currentTab = await setupTab(tabId);
  const insightTag = currentTab.insight_tags.find((tag: PixelTag) => tag.partnerId === partnerId)

  if (insightTag) {
    insightTag.status = status;

    await chrome.storage.local.set({
      [tabId]: currentTab
    })
  } else {
    await addInsightTag(tabId, partnerId, status)
  }

  return updateBadge(tabId);
}

const addPixelTag = async (tabId: number, partnerId: string, conversionId: string, status?: string) => {
  const currentTab = await setupTab(tabId);

  currentTab.pixels.push({
    partnerId, conversionId, status: status ? status : 'pending'
  });

  return chrome.storage.local.set({
    [tabId]: currentTab
  })
}

const updatePixelTagStatus = async (tabId: number, partnerId: string, conversionId: string, status: string) => {
  const currentTab = await setupTab(tabId);
  const pixelTag = currentTab.pixels.find((tag: PixelTag) => tag.partnerId === partnerId && tag.conversionId === conversionId)

  if (pixelTag) {
    pixelTag.status = status

    await chrome.storage.local.set({
      [tabId]: currentTab
    });
  } else {
    await addPixelTag(tabId, partnerId, conversionId, status);
  }

  return updateBadge(tabId);
}

const processRequest = async (request: WebRequest, status: string) => {
  const currentTab = await setupTab(request.tabId);

  if (/snap.licdn.com/i.test(request.url)) {
    (currentTab.pixels || []).forEach((pixel: PixelTag) => {
      if (pixel.partnerId) {
        updateInsightTagStatus(request.tabId, pixel.partnerId, status)
      }
    })
  } else if (/ads.linkedin.com/i.test(request.url)) {
    let urlData = new URL(request.url)
    let query: LinkedInTagParams = parseSearch(urlData.search)
    let partnerId: string = query.pid || ''

    if (!partnerId || !partnerId.length) return

    // If conversionId is present, it's not an insight tag
    if (/conversionId/i.test(request.url) && query.conversionId) {
      updatePixelTagStatus(request.tabId, partnerId, query.conversionId, status)
    } else {
      if (/\%2C/i.test(partnerId)) {
        partnerId.split("%2C").forEach((pId: string) => updateInsightTagStatus(request.tabId, pId, status))
      } else {
        updateInsightTagStatus(request.tabId, partnerId, status)
      }
    }
  }
}

chrome.webRequest.onBeforeRedirect.addListener(request => {
  processRequest(request, 'success')
}, { urls: matchingUrls })

chrome.webRequest.onCompleted.addListener(request => {
  processRequest(request, 'success')
}, { urls: matchingUrls })

chrome.webRequest.onErrorOccurred.addListener(request => {
  processRequest(request, 'error')
}, { urls: matchingUrls })

chrome.webRequest.onBeforeRequest.addListener(request => {
  processRequest(request, 'pending')
}, { urls: matchingUrls });


chrome.webNavigation.onBeforeNavigate.addListener(
  function (details) {
    if (details.parentFrameId < 0) {
      // clear tabId in data
      chrome.storage.local.remove(`${details.tabId}`)
    }
  }
)
