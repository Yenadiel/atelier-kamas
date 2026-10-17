; Ferme l'appli si elle tourne (la fenêtre « toujours au premier plan » masquerait
; sinon la boîte de dialogue « fermez Atelier Kamas » de l'installateur).
!macro customCheckAppRunning
  nsExec::Exec 'taskkill /IM "Atelier Kamas.exe" /F /T'
  Pop $0
  Sleep 800
!macroend
