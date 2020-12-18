import '../../assets/img/icon-34.png';
import '../../assets/img/icon-128.png';

window._linkedin_pixel_data = {}
const matchingUrls = ['<all_urls>']

const parseSearch = (search : string) : LinkedInTagParams => {
  if (!search) return {}
  if (!search.length) return {}
  if (/^\?/.test(search)) {
    search = search.slice(1)
  }

  const params = search
    .split("&").map((keyVal) => (keyVal || '').split('='))
    .reduce((query : {[key: string]: string}, keyVal : string[]) => {
      query[keyVal[0]] = keyVal[1]
      return query
    }, {})

  return params
}

const setupTab = (tabId : number) => {
  if (!window._linkedin_pixel_data[tabId]) {
    window._linkedin_pixel_data[tabId] = {
      insight_tags: [],
      pixels: []
    }
  }
}

const updateBadge = (tabId : number) => {
  chrome.browserAction.setBadgeText({
    tabId,
    text: String(window._linkedin_pixel_data[tabId].pixels.length + window._linkedin_pixel_data[tabId].insight_tags.length)
  })
}

const addInsightTag = (tabId : number, partnerId : string, status? :string) => {
  setupTab(tabId)
  window._linkedin_pixel_data[tabId].insight_tags.push({
    partnerId,
    status: status ? status : 'pending'
  })
}

const updateInsightTagStatus = (tabId : number, partnerId : string, status : string) => {
  setupTab(tabId)
  const insightTag = window._linkedin_pixel_data[tabId].insight_tags.find((tag : PixelTag) => tag.partnerId === partnerId)

  if (insightTag) {
    insightTag.status = status
  } else {
    addInsightTag(tabId, partnerId, status)
  }

  updateBadge(tabId)
}

const addPixelTag = (tabId : number, partnerId : string, conversionId : string, status? : string) => {
  setupTab(tabId)

  window._linkedin_pixel_data[tabId].pixels.push({
    partnerId, conversionId, status: status ? status : 'pending'
  })
}

const updatePixelTagStatus = (tabId : number, partnerId : string, conversionId : string, status : string) => {
  setupTab(tabId)
  const pixelTag = window._linkedin_pixel_data[tabId].pixels.find((tag : PixelTag) => tag.partnerId === partnerId && tag.conversionId === conversionId)

  if (pixelTag) {
    pixelTag.status = status
  } else {
    addPixelTag(tabId, partnerId, conversionId, status)
  }

  updateBadge(tabId)
}

const processRequest = (request : WebRequest, status : string) => {
  if (/snap.licdn.com/i.test(request.url)) {
    (window._linkedin_data_partner_ids || []).forEach((partnerId : string) => {
      updateInsightTagStatus(request.tabId, partnerId, status)
    })
  } else if (/ads.linkedin.com/i.test(request.url)) {
    let urlData = new URL(request.url)
    let query : LinkedInTagParams = parseSearch(urlData.search)
    let partnerId : string = query.pid || ''

    if (!partnerId || !partnerId.length) return

    // If conversionId is present, it's not an insight tag
    if (/conversionId/i.test(request.url) && query.conversionId) {
      updatePixelTagStatus(request.tabId, partnerId, query.conversionId, status)
    } else {
      if (/\%2C/i.test(partnerId)) {
        partnerId.split("%2C").forEach((pId : string) => updateInsightTagStatus(request.tabId, pId, status))
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
      delete window._linkedin_pixel_data[details.tabId]
    }
  }
)
