# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

make the list icon also the current route color
add a button of same size as the card/list time 'Add New Community' that will load a dialog box clone of login dialog but have following 2 steps to capture the data

Step 1:

name": "Kyozo Demo Community", - text input
  "tagline": "Perfecting the technology behind the Kyozo platform", custom text area with same style as text input of 2 rows
  "lore": "Join the Kyozo Announcements Community for updates on new communities and features on Kyozo.", - custom text area with 4 rows
  "mantras": "Kyozo is on a mission to connect the Cultural Industries.", text area with 2 rows
  "communityPrivacy": "private", - custom toggle button for public / private

Step 2: (and last step)
communityBackgroundImage: text area of similar style used in feed, when image selected, show the image in the dropzone with edit/delete icon on topr right
communityProfileImage: circle with border showing images Parallax1.jpg, Parallax2.jpg, Parallax3.jpg, Parallax4.jpg, Parallax5.jpg and last a plus in circle to browser and choose
color pallet showing 5 colors in rounded rects, clicking on any color brings chose color dialog
 "colorPalette": {
              "type": "array",
              "items": {
                "type": "map",
                "fields": {
                  "colorId": "number",
                  "hexCode": "string"
                }




curl -X POST 'https://waba.360dialog.io/v1/configs/webhook' \
  -H 'D360-API-Key: aZ7WxT0jyL2oQlzkHHIbD4zvAK' \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://4edf439c13a8.ngrok-free.app/api/whatsapp/webhook"}'


#!/bin/bash
# test-email.sh

curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_BSraSy53_DxkkdnandZ4mmVtb6doJNn7h' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "Welcome <welcome@kyozo.space>",
    "to": ["ashok.jaiswal@gmail.com"],
    "subject": "Test Email from Kyozo.space",
    "html": "<h1>Hello!</h1><p>This is a test email from welcome@kyozo.space</p>"
  }'

