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


curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_UScG81Gc_B3RxAM7JFxgDHczf5RUNLTQp' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "Acme <onboarding@resend.dev>",
    "to": ["ashok@kyozo.space"],
    "subject": "hello world",
    "html": "<p>it works!</p>",
    "reply_to": "onboarding@resend.dev"
  }'


right now, root soute checks for the community owner/leader login/auth, if not logged in, shows the landing page and if logged in, navates the user http://localhost:9003/communities route

on the other hand, public feed of this community is in http://localhost:9003/c/willer i.e. in the /c route

we want to change this behaviour, we want to have pro.kyozo.com to have the current landing page and check the auth here for community owner and if logged in then redirect the user to pro.kyozo.com/communities 

and then on www.kyozo.com/[handle] is where we want show the community leader's feed directly and on www.kyozo.com/[handle]/signup is where we want to show community member to be able to sign up as member of this community feed with their first/last name, mobile number, avatar icon, email and password (or continue with google, pull the icon from there and then ask for mobile number to complete the membership registration), we use the dialog styling we used in Join the waitlist dialog

without starting to implment above, tell me how can we do above? how do we organize our current nextjs project to achieve above?