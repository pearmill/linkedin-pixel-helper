import React, { useEffect, useState } from 'react'
import Logo from '../Logo'
import './Popup.css';

let timer: number
const Popup = () => {
  const [currentTabId, setCurrentTabId] = useState<number | null | undefined>(null)
  const [tabData, setTabData] = useState<ExtensionTabData>()

  useEffect(() => {
    timer = window.setInterval(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        setCurrentTabId(tabs[0].id)
      })
    }, 200);

    return () => {
      clearInterval(timer)
    }
  }, []);

  useEffect(() => {
    async function updateTabData() {
      const item = await chrome.storage.local.get(`${currentTabId}`);

      console.log('item', item)
      if (item && item[`${currentTabId}`]) {
        setTabData(item[`${currentTabId}`])
      }
    }

    chrome.storage.onChanged.addListener(updateTabData);

    updateTabData();
    return () => chrome.storage.onChanged.removeListener(updateTabData);
  }, [currentTabId]);

  const renderInsightTag = (index: number, partnerId?: string, status?: string) => {
    return (
      <li className="tag-item" key={`{index}-{partnerId}`}>
        <div className={"tag-status " + status}></div>
        <div className="tag-index">{index + 1}.</div>
        <div className="tax-content">
          <div className="tax-type">LinkedIn Insight Tag</div>
          <div className="tax-ids">Partner Id: {partnerId}</div>
        </div>
      </li>
    )
  }

  const renderPixelTag = (index: number, partnerId?: string, conversionId?: string, status?: string) => {
    return (
      <li className="tag-item" key={`{index}-{partnerId}`}>
        <div className={"tag-status " + status}></div>
        <div className="tag-index">{index + 1}.</div>
        <div className="tax-content">
          <div className="tax-type">Event Pixel</div>
          <div className="tax-ids">
            <div>Partner Id: {partnerId}</div>
            <div>Conversion Id: {conversionId}</div>
          </div>
        </div>
      </li>
    )
  }

  if (!currentTabId) {
    return (
      <div className="App-empty-state"></div>
    )
  }

  const pearmillLogoURL = chrome.runtime.getURL("/pearmill.png")
  return (
    <div className="App">
      <header className="App-header">
        <Logo />
        <h1>Pearmill Pixel Helper</h1>
      </header>

      {tabData ? (
        <ol className="App-insight-tags App-tags">
          {tabData.insight_tags.map(({ partnerId, status }, index: number) => renderInsightTag(index, partnerId, status))}
          {tabData.pixels.map(({ partnerId, conversionId, status }, index: number) => renderPixelTag(tabData.insight_tags.length + index, partnerId, conversionId, status))}
        </ol>
      ) : (
        <div className="App-empty-state">No LinkedIn Insight Tag or Event Pixels were found on this page.</div>
      )}

      <footer className="App-footer">
        Built by <a href="https://pearmill.com?utm_campaign=linkedIn-extension&utm_source=chrome-extension&utm_medium=browser" target="_blank"><img src={pearmillLogoURL} id='pm-logo' /></a>
      </footer>
    </div>
  )
}



export default Popup
