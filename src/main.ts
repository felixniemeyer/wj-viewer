import './style.css'

const iframePermissions = 'autoplay; encrypted-media; picture-in-picture'

class EmbeddedWebsite {
  private container: HTMLDivElement

  constructor(
    iframe: HTMLIFrameElement, 
  ) {
    this.container = document.createElement('div')
    this.container.className = 'wrapper'
    this.container.appendChild(iframe)
  }

  getContainer() {
    return this.container
  }

  // override if you want to handle messages
  onMessage(_message: any) {
  }
}

class CustomWebsite extends EmbeddedWebsite {
  constructor(
    url: string
  ) {
    const iframe = document.createElement('iframe')
    iframe.src = url
    super(iframe)
  }
}


const controllableListeners: {[id: number]: (message: any) => void} = {}



class Controllable extends EmbeddedWebsite {
  static nextId = 0

  private iframe: HTMLIFrameElement
  private controllableId: number

  constructor(
    url: string, 
    private id: number, 
  ) {
    const iframe = document.createElement('iframe')
    iframe.src = url

    super(iframe)

    this.iframe = iframe
    this.controllableId = Controllable.nextId++

    console.log('sending you-are message', this.controllableId)
    const requestAnnouncement = () => {
      console.log('sending you-are') 
      if(!receivedReceiverAnnouncements[this.controllableId]) {
        setTimeout(() => {
          this.iframe.contentWindow?.postMessage({
            protocol: 'av-controls', 
            type: 'you-are', 
            id: this.controllableId, 
          }, '*')
        })
        setTimeout(requestAnnouncement, 500)
      } else {
        delete receivedReceiverAnnouncements[this.controllableId]
      }
    }
    this.iframe.addEventListener('load', requestAnnouncement)

    controllableListeners[this.controllableId] = (message) => {
      window.opener.postMessage({
        type: 'av-controls', 
        payload: {
          id: this.id, 
          message
        }
      }, '*')
    }
  }

  onMessage(message: any) {
    this.iframe.contentWindow?.postMessage(message, '*')
  }
}

const ytPrepareContainer = document.createElement('div')
ytPrepareContainer.style.display = 'none'
ytPrepareContainer.id = 'yt-prepare'

document.body.appendChild(ytPrepareContainer)
const ytParams = 'enablejsapi=1&autoplay=1&mute=1&controls=0&showinfo=0&autohide=1&modestbranding=1'
class YoutubeVideo extends EmbeddedWebsite {
  player: any

  constructor(
    videoId: string, 
  ) {
    const iframe = document.createElement('iframe')
    ytPrepareContainer.appendChild(iframe)

    iframe.setAttribute('frameborder', '0')

    iframe.setAttribute('allow', iframePermissions)
    iframe.setAttribute('allowfullscreen', 'true')

    iframe.src = `https://www.youtube.com/embed/${videoId}?${ytParams}`

    const player = new (globalThis as any).YT.Player(iframe, {
      videoId,
      events: {
        'onReady': () => {
          player.playVideo()
        }, 
        'onStateChange': () => {
          // restart if ended
          if (player.getPlayerState() === 0) {
            player.seekTo(0)
          }
        }
      }
    });

    super(iframe)

    this.player = player
  }
}

const cablesUrl = "https://cables.gl/view/"
class CablesProject extends EmbeddedWebsite {
  constructor(
    projectId: string, 
  ) {
    const iframe = document.createElement('iframe')

    iframe.setAttribute('frameborder', '0')
    iframe.setAttribute('loading', 'lazy')

    iframe.src = cablesUrl + projectId 
    iframe.style.width = '100%'
    iframe.style.height = '100%'

    super(iframe)
  }
}

const shadertoyUrl = "https://www.shadertoy.com/embed/"
const shadertoyOptions = "?gui=false&paused=false"
class ShadertoyShader extends EmbeddedWebsite {
  constructor(
    shaderId: string, 
  ) {
    const iframe = document.createElement('iframe')

    iframe.setAttribute('frameborder', '0')
    iframe.setAttribute('loading', 'lazy')

    iframe.src = shadertoyUrl + shaderId + shadertoyOptions
    iframe.style.width = '100%'
    iframe.style.height = '100%'

    super(iframe)
  }
}

// iframe url: https://platform.twitter.com/embed/Tweet.html?dnt=false&embedId=twitter-widget-0&features=e30%3D&frame=false&hideCard=false&hideThread=false&id=1817301999613792525&lang=en&maxWidth=560px&origin=file%3A%2F%2F%2Fhome%2Ffelix%2Ftemp%2Ftwitter-embed.html&theme=light&widgetsVersion=2615f7e52b7e0%3A1702314776716&width=550px

// x video
// const xUrl = "https://platform.twitter.com/embed/Tweet.html?dnt=false&embedId=twitter-widget-0&features=e30%3D&frame=false&hideCard=false&hideThread=false&id=1817301999613792525&lang=en&maxWidth=560px&origin=file%3A%2F%2F%2Fhome%2Ffelix%2Ftemp%2Ftwitter-embed.html&theme=light&widgetsVersion=2615f7e52b7e0%3A1702314776716&width=550px"
// class xVideo extends EmbeddedWebsite {
// // This is the offical way: <blockquote class="twitter-tweet" data-media-max-width="560"><p lang="zxx" dir="ltr"><a href="https://t.co/IjTx9caaqe">https://t.co/IjTx9caaqe</a></p>&mdash; SpaceX (@SpaceX) <a href="https://twitter.com/SpaceX/status/1817301999613792525?ref_src=twsrc%5Etfw">July 27, 2024</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
//   constructor(
//     videoId: string, 
//   ) {
//     const iframe = document.createElement('iframe')
// 
//     iframe.setAttribute('frameborder', '0')
// 
//     iframe.src = `https://www.youtube.com/embed/${videoId}?${ytParams}`
//     iframe.style.width = '100%'
//     iframe.style.height = '100%'
// 
//     super(iframe)
//   }
// }


class WebsiteStack {
  private order: number[] = []
  private websites: {[id: number]: EmbeddedWebsite} = {}



  constructor(
    private container: HTMLElement
  ) {
  }

  public addWebsite(website: EmbeddedWebsite, id: number) {
    const container = website.getContainer()
    container.style.opacity = '0'
    container.style.zIndex = this.order.length.toString()

    this.container.appendChild(container)
    this.websites[id] = website
    this.order.push(id)
  }

  public removeWebsite(id: number) {
    const website = this.websites[id]
    if(website === undefined) {
      console.error('failed to remove website that does not exist, id:', id)
    } else {
      this.container.removeChild(website.getContainer())
      delete this.websites[id]

      // remove from order
      this.order = this.order.filter(orderId => orderId !== id)
    } 
  }

  public setWebsiteOpacity(id: number, opacity: number) {
    const website = this.websites[id]
    if(website !== undefined) {
      const iframe = website.getContainer()
      iframe.style.opacity = opacity.toString()
    }
  }

  public setWebsiteBlendMode(id: number, blendMode: string) {
    const website = this.websites[id]
    if(website !== undefined) {
      const iframe = website.getContainer()
      iframe.style.setProperty('mix-blend-mode', blendMode)
    }
  }

  private scale = 1
  public setWebsiteScale(id: number, scale: number) {
    const website = this.websites[id]
    if(website !== undefined) {
      const iframe = website.getContainer()
      this.scale = scale
      this.updateScale(iframe)
    }
  }

  private lowresScale = 1
  public setWebsiteLowres(id: number, lowres: number) {
    const website = this.websites[id]
    if(website !== undefined) {
      const iframe = website.getContainer()
      iframe.style.width = 100/lowres + '%'
      iframe.style.height = 100/lowres + '%'
      this.lowresScale = lowres
      this.updateScale(iframe)
    }
  }

  private updateScale(iframe: HTMLDivElement) {
    const totalScale = this.scale * this.lowresScale
    iframe.style.transform = `translate(-50%, -50%) scale(${totalScale})`
  }

  public moveWebsiteToTop(id: number) {
    const index = this.order.indexOf(id)

    this.order.splice(index, 1) 
    this.order.push(id)

    this.updateZIndices()
  }

  public moveWebsiteBelow(id: number, referenceId: number) {
    const index = this.order.indexOf(id)
    const referenceIndex = this.order.indexOf(referenceId)

    this.order.splice(index, 1)
    this.order.splice(referenceIndex, 0, id)

    this.updateZIndices()
  }

  private updateZIndices() {
    this.order.forEach((id, index) => {
      const website = this.websites[id]
      website.getContainer().style.zIndex = index.toString()
    })
  }

  public disableWebsite(id: number) {
    const website = this.websites[id]
    website.getContainer().style.display = 'none'
  }

  public enableWebsite(id: number) {
    const website = this.websites[id]
    website.getContainer().style.display = 'block'
  }

  public routeMessage(id: number, message: any) {
    const website = this.websites[id]
    website.onMessage(message)
  }
}

function initializeYoutubeAPI() {
  return new Promise<void>((resolve, reject) => {
    // watchdog
    setTimeout(() => {
      reject('youtube api failed to load')
    }, 7000)

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    youtubeReadyListeners.push(() => {
      resolve()
    })
  })
}

let YT: any = undefined
const youtubeReadyListeners = [] as (() => void)[]
(globalThis as any).onYouTubeIframeAPIReady = () => {
  YT = (globalThis as any).YT
  youtubeReadyListeners.forEach(listener => listener())
}

const receivedReceiverAnnouncements = {
} as {[id: number]: boolean}

async function main() {
  try {
    await initializeYoutubeAPI()
  } catch {
    console.error('youtube api failed to load, youtube videos will not work')
  }

  const stackContainer = document.getElementById('stack-container')!
  const websiteStack = new WebsiteStack(stackContainer)

  // examples 
  // websiteStack.addWebsite(new ShadertoyShader('Mcjczw'))
  // websiteStack.addWebsite(new YoutubeVideo('-YJ388owgBE'))
  
  window.addEventListener('message', (event) => {
    const protocol = event.data.protocol
    if(protocol == 'av-controls') {
      const id = event.data.receiverId
      if(event.data.type === 'announce-receiver') {
        receivedReceiverAnnouncements[id] = true
      }
      const listener = controllableListeners[id]
      if(listener !== undefined) {
        listener(event.data)
      }
    } else if (protocol == 'wj-mixer') {
      const type = event.data.type
      const payload = event.data.payload
      if(type === 'add-website') {
        if(payload.website === 'custom') {
          websiteStack.addWebsite(new CustomWebsite(payload.url), payload.id)
        } else if(payload.website === 'controllable') {
          websiteStack.addWebsite(new Controllable(payload.url, payload.id), payload.id)
        } else if(payload.website === 'shadertoy') {
          websiteStack.addWebsite(new ShadertoyShader(payload.shaderId), payload.id)
        } else if(payload.website === 'cables') {
          websiteStack.addWebsite(new CablesProject(payload.projectId), payload.id)
        } else if(payload.website === 'youtube') {
          console.log('should add youtube', YT)
          if(YT !== undefined) {
            websiteStack.addWebsite(new YoutubeVideo(payload.videoId), payload.id)
          }
        }
      } else if (type === 'remove-website') {
        websiteStack.removeWebsite(payload.id)
      } else if (type === 'set-opacity') {
        websiteStack.setWebsiteOpacity(payload.id, payload.opacity)
      } else if (type === 'set-blend-mode') {
        websiteStack.setWebsiteBlendMode(payload.id, payload.blendMode)
      } else if (type === 'set-scale') {
        websiteStack.setWebsiteScale(payload.id, payload.scale)
      } else if (type === 'set-lowres') {
        websiteStack.setWebsiteLowres(payload.id, payload.lowres)
      } else if (type === 'arrange') {
        if(payload.position === 'below') {
          websiteStack.moveWebsiteBelow(payload.id, payload.referenceId)
        } else if (payload.position === 'top') {
          websiteStack.moveWebsiteToTop(payload.id)
        }
      } else if (type === 'disable') {
        websiteStack.disableWebsite(payload.id)
      } else if (type === 'enable') {
        websiteStack.enableWebsite(payload.id)
      } else if (type === 'message') { // forward message to the website
        websiteStack.routeMessage(payload.id, payload.message)
      } else if (type === 'reload') {
        window.location.reload()
      } 
    }
  })

  window.opener.postMessage({type: 'ready'}, '*')
}

window.onload = main
