npm run build && ( echo 'copying to server' ; rsync -av --delete dist/ felix@139.162.184.89:/home/felix/gfx/wj-mixer-viewer/ )
