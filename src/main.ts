import './style.css'

const iframePermissions = 'autoplay; encrypted-media; picture-in-picture'

class EmbeddedWebsite {
  constructor(
    private iframe: HTMLDivElement | HTMLIFrameElement, 
  ) {
    console.log('iframe created', iframe)
  }

  getIframe() {
    return this.iframe
  }
}

const ytPrepareContainer = document.createElement('div')
ytPrepareContainer.style.display = 'none'
ytPrepareContainer.id = 'yt-prepare'

document.body.appendChild(ytPrepareContainer)

const ytParams = 'enablejsapi=1&autoplay=1&mute=1&controls=0&showinfo=0&autohide=1&modestbranding=1&rel=0'
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
          console.log('ready')
          player.playVideo()
        }, 
        'onStateChange': () => {
          console.log('state change')
          // restart if ended
          if (player.getPlayerState() === 0) {
            player.seekTo(0)
          }
        }
      }
    });

    console.log(player)

    super(iframe)

    this.player = player
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

    iframe.src = shadertoyUrl + shaderId + shadertoyOptions
    iframe.style.width = '100%'
    iframe.style.height = '100%'

    super(iframe)
  }
}


class WebsiteStack {
  private websites: EmbeddedWebsite[] = []

  constructor(
    private container: HTMLElement
  ) {
  }

  public addWebsite(website: EmbeddedWebsite) {
    console.log('eigentich bewegen wir hier ein html element') 
    this.container.appendChild(website.getIframe())
    this.websites.push(website)
  }
}


let YT: any
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

const youtubeReadyListeners = [] as (() => void)[]
(globalThis as any).onYouTubeIframeAPIReady = () => {
  console.log('youtube api ready')
  youtubeReadyListeners.forEach(listener => listener())
}

async function main() {
  await initializeYoutubeAPI()
  const stackContainer = document.getElementById('stack-container')!
  const websiteStack = new WebsiteStack(stackContainer)
//   websiteStack.addWebsite(new ShadertoyShader('4td3zj'))
  websiteStack.addWebsite(new ShadertoyShader('Mcjczw'))
  websiteStack.addWebsite(new YoutubeVideo(
    '-YJ388owgBE'
  ))
}

window.onload = main
