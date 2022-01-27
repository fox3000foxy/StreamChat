const Discord = require('discord.js')
const fetch = require('node-fetch');
const { parser, htmlOutput, toHTML } = require('discord-markdown');
const client = new Discord.Client()
const port = 8080
// console.clear()

client.on('ready',()=>{
	const express = require('express')
	const cors = require('cors')
	const app = express()
	const http = require('http');
	const server = http.createServer(app);
	const { Server } = require("socket.io");
	const io = new Server(server);
	client.on('message',(msg)=>{io.emit('message',msg)})
  client.on('messageDelete',(msg)=>{io.emit('message',msg)})
  client.on('messageUpdate',(msg)=>{io.emit('message',msg)})
	app.use(cors())
	app.get('/api',async (req,res)=>{
    if(req.query.channel!='undefined') {
      let messagesArray = new Array()
      let channel = client.channels.cache.get(req.query.channel)
      await channel.messages.fetch({
        limit: 65,
      }).then((messages) => {
        // console.log(messages)
        messages.forEach((message)=>{
          //color
          let guild = message.guild;
        let member = guild.member(message.author);
        let nickname = member ? member.displayName : null;
          let color;
          if(message.member!=null) color = message.member.displayHexColor
          else color = "#ffffff"
          let {author,id} = message
          let content = toHTML(message.content,  {
            discordCallback: {
              user: node => `<mention class="mention wrapper-3WhCwL mention interactive">@${client.users.cache.get(node.id)?client.users.cache.get(node.id).username:'[Infetchable]'}</mention>`
            }
          })
          if(content=='') content = toHTML("`[Attachement]`")
          let moderator = '';
          //console.log(message.author.username,message.member.hasPermission('MANAGE_MESSAGES'))
          if(message.member && message.member.hasPermission('ADMINISTRATOR'))
            moderator = '<img class="d-emoji" src="https://cdn0.iconfinder.com/data/icons/construction-12/64/club_hammer-512.png">'
            //console.log(message.guild.ownerID,message.author.id)
          if(message.guild.ownerID == message.author.id)
            moderator = '<img class="d-emoji" src="https://cliply.co/wp-content/uploads/2021/03/392103930_CROWN_EMOJI_400.png">'
          let bot = ''
          if(message.author.bot && !message.webhookID)
            bot = '<img class="d-emoji" src="https://emoji.gg/assets/emoji/9435-blurple-bot.png">'
          let edited = ''
          if(message.editedTimestamp) edited = '<span style="color:gray;user-select: none;">(edited)</span>'
          let formatted = `
            <message id="${id}">
              <img class="d-emoji" style="border-radius:4px" src="${message.author.avatarURL()}">
              <span onclick="mentionId('${author.id}')" style="color:${color}">${nickname!=null?nickname:author.username} ${bot}${moderator}:</span>
              <span style="color:white">${content}</span>
              ${edited}
              <br>
            </message>
          `
          messagesArray.push({
            color,content,author,id,formatted
          })
        })
      });
      res.send(messagesArray)
    }
    else res.send([{formatted:"<i style='color:white'>Please type /?channel=[channelID]</i>"}])
	})
	app.get('/',(req,res)=>{res.sendFile(__dirname+"/src/index.html")})
	app.get('/login', async ({ query }, response) => {
		const { code } = query;

		if (code) {
			try {
				const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
					method: 'POST',
					body: new URLSearchParams({
						client_id: '924278077087948840',
						client_secret: 'aUHluoXujoRXwB4bWEXM0Z4bA6VPx6TW',
						code,
						grant_type: 'authorization_code',
						redirect_uri: `https://streamchat.fox3000.repl.co/login`,
						scope: 'identify',
					}),
					headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				});

				const oauthData = await oauthResult.json();
				const userResult = await fetch('https://discord.com/api/users/@me', {
					headers: {
						authorization: `${oauthData.token_type} ${oauthData.access_token}`,
					},
				});

				await userResult.json().then((res)=>{
					if(res.message) response.redirect('/')
					else response.send(`
						<script>
							localStorage.setItem('credentials','${JSON.stringify(res)}')
							setTimeout("location.href='/'",10)
						</script>
            Pleasec wait...
					`)
				})
			} catch (error) {console.error(error);}
		}else{response.redirect('/')}
	})
	app.get('/sendMessage',async (req,res)=>{
    if(req.query.content=='') res.send('empty message !')
		const channel = client.channels.cache.get(req.query.channel)
		const webhooks = await channel.fetchWebhooks();
		let webhook = webhooks.find(wh => wh.token);
		if (!webhook) {
			channel.createWebhook('StreamWebhook').then(webhookCreated => {
				webhook = webhookCreated
			})
		}
		await webhook.send({
			content: req.query.content,
			username: req.query.username,
			avatarURL: req.query.avatarURL
		});
		res.send("ok")
	})
  app.get('/channel',(req,res)=>{
    res.send({
      channel: client.channels.cache.get(req.query.id),
      guild: client.guilds.cache.get(client.channels.cache.get(req.query.id).guild.id),
      icon:client.guilds.cache.get(client.channels.cache.get(req.query.id).guild.id).iconURL()
    })
  })
  app.get('/logs',(req,res)=>{
    res.sendFile(__dirname+"/logs.txt")
  })

	server.listen(port)
	console.log(client.user.username+"#"+client.user.discriminator,"is ready")
})
client.login('OTA0NzEzMDk1MDE0OTIwMjEz'+'.YX_hug.QsWKCyiNVG40kxIUUAjG4ljPczg')

process.on('unhandledRejection', (reason, p) => {
  const fs = require('fs');
  console.log('Unhandled Rejection at: Promise',p,'reason:',reason)
  const error = 'Unhandled Rejection at: Promise'+p+'reason:'+reason+"\n"
  fs.appendFile('logs.txt', error, function (err) {
    if (err) throw err;
    console.log('Error ! Check logs !');
  });
});