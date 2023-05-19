import React from 'react'
import logo from '../../assets/img/LI-logo.png'
import pearmill from '../../assets/img/pearmill.png'
import './Popup.css';

let timer: number
class Popup extends React.Component<PopupProps, PopupState> {
  state: PopupState = {}

  componentDidMount() {
    timer = window.setInterval(() => {
      const backgroundPage = chrome.extension.getBackgroundPage() as any
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        if (backgroundPage) {
          this.setState({
            data: backgroundPage["_linkedin_pixel_data"],
            tabId: tabs[0].id
          })
        }
      })
    }, 200);
  }

  renderInsightTag(index: number, partnerId?: string, status?: string) {
    return (
      <li className="tag-item" key={`{index}-{partnerId}`}>
        <div className={"tag-status " + status}></div>
        <div className="tag-index">{index + 1}.</div>
        <div className="tax-content">
          <div className="tax-type">Insight Tag</div>
          <div className="tax-ids">Partner Id: {partnerId}</div>
        </div>
      </li>
    )
  }

  renderPixelTag(index: number, partnerId?: string, conversionId?: string, status?: string) {
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

  componentDidUnMount() {
    clearInterval(timer)
  }

  render() {
    const data: { [key: number]: ExtensionTabData } = this.state.data || {}
    if (!this.state.tabId) {
      return (
        <div className="App-empty-state"></div>
      )
    }

    const currentTabData: ExtensionTabData = data[this.state.tabId]

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo as string} id='li-logo' />
          <h1>LinkedIn Pixel Helper</h1>
        </header>

        {currentTabData ? (
          <ol className="App-insight-tags App-tags">
            {currentTabData.insight_tags.map(({ partnerId, status }, index: number) => this.renderInsightTag(index, partnerId, status))}
            {currentTabData.pixels.map(({ partnerId, conversionId, status }, index: number) => this.renderPixelTag(currentTabData.insight_tags.length + index, partnerId, conversionId, status))}
          </ol>
        ) : (
          <div className="App-empty-state">No LinkedIn Insight Tag or Event Pixels were found on this page.</div>
        )}

        <footer className="App-footer">
          Built by <a href="https://pearmill.com?utm_campaign=linkedIn-extension&utm_source=chrome-extension&utm_medium=browser" target="_blank"><img src={pearmill as string} id='pm-logo' /></a>
        </footer>
      </div>
    )
  }
}

export default Popup
