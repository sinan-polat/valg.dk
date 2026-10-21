@echo off
chcp 65001 >nul
echo Henter GLOD-fotos fra Unsplash ...
cd /d "%~dp0"
if not exist "img\fotos" mkdir "img\fotos"
curl -L -s -f -o "img\fotos\ansigtsbehandling.jpg" "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=max&w=1600&q=80&fm=jpg" && echo   OK  ansigtsbehandling.jpg || echo   FEJL ansigtsbehandling.jpg
curl -L -s -f -o "img\fotos\behandlingsrum.jpg" "https://images.unsplash.com/photo-1695527081827-fdbc4e77be9b?auto=format&fit=max&w=1600&q=80&fm=jpg" && echo   OK  behandlingsrum.jpg || echo   FEJL behandlingsrum.jpg
curl -L -s -f -o "img\fotos\bryn-1.jpg" "https://images.unsplash.com/photo-1516220362602-dba5272034e7?auto=format&fit=max&w=1000&q=80&fm=jpg" && echo   OK  bryn-1.jpg || echo   FEJL bryn-1.jpg
curl -L -s -f -o "img\fotos\bryn-2.jpg" "https://images.unsplash.com/photo-1696236537686-214907dfcd9a?auto=format&fit=max&w=1000&q=80&fm=jpg" && echo   OK  bryn-2.jpg || echo   FEJL bryn-2.jpg
curl -L -s -f -o "img\fotos\eukalyptus.jpg" "https://images.unsplash.com/photo-1546387903-6d82d96ccca6?auto=format&fit=max&w=1600&q=80&fm=jpg" && echo   OK  eukalyptus.jpg || echo   FEJL eukalyptus.jpg
curl -L -s -f -o "img\fotos\forside-portraet.jpg" "https://images.unsplash.com/photo-1508978644997-53cc5bfb8a03?auto=format&fit=max&w=1600&q=80&fm=jpg" && echo   OK  forside-portraet.jpg || echo   FEJL forside-portraet.jpg
curl -L -s -f -o "img\fotos\frisoer.jpg" "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=max&w=1600&q=80&fm=jpg" && echo   OK  frisoer.jpg || echo   FEJL frisoer.jpg
curl -L -s -f -o "img\fotos\haar-bagfra.jpg" "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=max&w=1600&q=80&fm=jpg" && echo   OK  haar-bagfra.jpg || echo   FEJL haar-bagfra.jpg
curl -L -s -f -o "img\fotos\haar-glans.jpg" "https://images.unsplash.com/photo-1602549179763-ce6c9df961b7?auto=format&fit=max&w=1000&q=80&fm=jpg" && echo   OK  haar-glans.jpg || echo   FEJL haar-glans.jpg
curl -L -s -f -o "img\fotos\haar-kroeller.jpg" "https://images.unsplash.com/photo-1560264641-1b5191cc63e2?auto=format&fit=max&w=1000&q=80&fm=jpg" && echo   OK  haar-kroeller.jpg || echo   FEJL haar-kroeller.jpg
curl -L -s -f -o "img\fotos\haar-rundboerste.jpg" "https://images.unsplash.com/photo-1734111719430-fe4a3973f8af?auto=format&fit=max&w=1000&q=80&fm=jpg" && echo   OK  haar-rundboerste.jpg || echo   FEJL haar-rundboerste.jpg
curl -L -s -f -o "img\fotos\plante-lys.jpg" "https://images.unsplash.com/photo-1683138767595-7e2a46dfde54?auto=format&fit=max&w=1000&q=80&fm=jpg" && echo   OK  plante-lys.jpg || echo   FEJL plante-lys.jpg
curl -L -s -f -o "img\fotos\portraet-langt-haar.jpg" "https://images.unsplash.com/photo-1672719699796-ef70ba746ca8?auto=format&fit=max&w=1600&q=80&fm=jpg" && echo   OK  portraet-langt-haar.jpg || echo   FEJL portraet-langt-haar.jpg
curl -L -s -f -o "img\fotos\ritual-haandklaeder.jpg" "https://images.unsplash.com/photo-1706795033849-7ca391f007c5?auto=format&fit=max&w=1600&q=80&fm=jpg" && echo   OK  ritual-haandklaeder.jpg || echo   FEJL ritual-haandklaeder.jpg
curl -L -s -f -o "img\fotos\vipper-1.jpg" "https://images.unsplash.com/photo-1639629509821-c54cdd984227?auto=format&fit=max&w=1600&q=80&fm=jpg" && echo   OK  vipper-1.jpg || echo   FEJL vipper-1.jpg
curl -L -s -f -o "img\fotos\vipper-2.jpg" "https://images.unsplash.com/photo-1683719312734-e31de63957ab?auto=format&fit=max&w=1000&q=80&fm=jpg" && echo   OK  vipper-2.jpg || echo   FEJL vipper-2.jpg
echo.
echo Faerdig. Billederne ligger nu i img\fotos
pause
