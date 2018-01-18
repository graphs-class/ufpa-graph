import * as config from './config'
import * as utils from './utils'
import * as ui from './ui'
import * as worker from './worker-controller'

const $importBtn = document.getElementById('import-modal-btn')
const $importInput = document.getElementById('import-file')
const $faceBtns = Array.from(document.querySelectorAll('.change-face-btn'))

$importBtn.addEventListener('click', clickFileInput)
$importInput.addEventListener('change', fileInputChanged)
$faceBtns.forEach($btn =>
  $btn.addEventListener('click', changeFaceBtnClicked)
)

function clickFileInput(e) {
  e.preventDefault()
  $importInput.click()
}

function fileInputChanged(e) {
  Promise.all(Array.from(e.target.files).map(file =>
    utils.extractLattes(file).then(xml =>
      worker.send({
        type: 'parseXml',
        xml
      })
    )
  ))
}

function changeFaceBtnClicked(e) {
  const face = +e.target.getAttribute('data-face')

  $faceBtns.forEach(($btn, i) => {
    if (i === face) {
      $btn.setAttribute('disabled', true)
      $btn.classList.remove('btn-info')
    } else {
      $btn.removeAttribute('disabled')
      $btn.classList.add('btn-info')
    }
  })

  config.set('face', face)
  worker.send({
    type: 'setFace',
    face,
  })
}
