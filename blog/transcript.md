Transcript
March 27, 2025, 10:08PM

Lori Fraleigh started transcription

Allen Zhang (DEVDIV) 0:03
And then I'll also talk about the current status.
You know the way it's been 2 days since I sent out the weekly status.
As we close to the release time RC time, I'll give updated as of today.
So the Mario already posted the write up on the single executable.
First of all, I wanna if folks have read it and have any questions.
So basically at this point.
Because we built that under experimental feature on the note.
So we have been discussing with that.
Developer champion about this. The short story, aside from what Tim said, is basically for RC time.
We will.
I think we had agreement on this, right? The single executable gonna be listed as a preview experimental feature.
There are a couple of reasons for it.
A list of things that need really need better support, but also this feature is built on is also experimental.
Also for.

1:15
I'll repeat what I said last time.

Allen Zhang (DEVDIV) 1:16
Our.

1:18
I understand where you guys are at focus on one path. Simple getting started.

Speaker 1 1:24
Don't try to explain every possible way everyone could possibly do anything.
Get focused on making it simple to get started with one path.

Allen Zhang (DEVDIV) 1:31
Mm.

Speaker 1 1:32
Pick the path but keep it simple.

Allen Zhang (DEVDIV) 1:36
Yeah. So there are some follow up we need to do particular exploring how we can assist in getting this feature.
To a more stable state so we can take dependency on that.
There are also other couple other avenues around, you know.
With the bond with.
The.
Shipping ourselves.
So there are a couple alternative.
We're so evaluating and then basically.
For the immediate term, that status for this SCA is not gonna change.
But we're actively looking for one and then hopefully meet that requirement to make this as simple.
Umm.
OK.
So the second thing is I sent out the the status weekly status on Tuesday as our our after our Squam.
So the current status, you know it's going well.
We have the one I sent out.
There's six open issues still.
But as of today, we have up eight and then as of today we have 6.
The last item we're looking at is getting the HP file changes.
And etas today.
After that, the remaining issues are all just process things. We need to have on the day of release. Getting the package updated.
Umm.
And.
Yeah, the bug has been fixed. So yeah. So and then we've been focusing, the team has been focusing on documentations.
We have a number of doc bug.
Created and some are fixed and some are in a process of being fixed.
But the doc release is separate from the the package release, so we have a. So we we're basically just, you know making making progress on the on the remaining doc issues.
So the doc publishing is separate meaning as soon as we check into the repo.
The action will bring the website up to the once emerged. It will refresh your doc website.
So we have always a very.
Real time way to get those updated without pending on release process.
So that part is going well. So as of right now, the plan is we want to do Co freeze for all the core libraries for one O packages to lock down tomorrow having coordinating with Shanghai to do initial testing and.
And also future testing and also we're gonna experiment with the package version dependencies and so that we have a quick follow after we.
Do the release on for second.

Speaker 2 4:25
Ellen. What? What? What is the the difference in time between releasing the package and releasing the documentation in practice?

Allen Zhang (DEVDIV) 4:26
Take a second.
In practice, the documentation is always ongoing.
We making fixes as needed.

4:40
OK.

Allen Zhang (DEVDIV) 4:41
So it's a it's it's a really on demand.

4:43
I'm not.

Speaker 2 4:43
I misunderstood what you were saying, so you you can ignore my question, OK?

Allen Zhang (DEVDIV) 4:48
Yeah.
Yeah, so, so far I there's no risk.
We just, you know, bracing ourselves for the for the release.

Speaker 1 5:02
So something Mandy and I were talking about earlier today is that we, we kind of think of this project a little bit.
This isn't like an enterprise project where this is the this is a community project that Microsoft is sponsoring.

5:11
Yeah, yeah.
And.

Speaker 1 5:20
We're trying to figure out what the right way to communicate to customers is to say like support is through GitHub. Like don't call Microsoft BSS or CSS for type spec support.
Like we need to, we need to find the way that we're gonna thread the needle on open source community project sponsored by Microsoft versus Microsoft released product.

Allen Zhang (DEVDIV) 5:47
OK.
So the the website we have a community page I I guess.
Yeah, that maybe we didn't specifically call out say this is separate from Microsoft, but I do see there's a Microsoft logo at the bottom.

Speaker 2 6:04
Well, that's that's OK.
Well, that's that's.
It's OK to be, you know, sponsored by Microsoft.

Allen Zhang (DEVDIV) 6:06
Yeah, yeah.

Speaker 2 6:08
You know, Peter's point is that there should be a something there says if you have problems.

Allen Zhang (DEVDIV) 6:09
I.

6:13
This is where you go.

Speaker 1 6:15
Yeah. And at 10 like one, the 10 release is a community project choice, not a not a Microsoft product choice.

6:17
Right.
Hello.
Right.

Allen Zhang (DEVDIV) 6:24
Yep, we have the blog post impending.
Still under last scrub. I'll go take a look again.
I think this has been called out engaging our Community page, which all of the open source GitHub.

6:39
Yeah.

Allen Zhang (DEVDIV) 6:41
Discord. So but for that messaging, I'll work with Mario to make sure that doesn't lead to any misunderstanding there.

Speaker 2 6:49
It needs to be someplace where people will find it.

Mayuri Diwan 6:49
Alan.

6:52
Right.

Speaker 2 6:52
Not not buried somewhere.
Not not buried.
I think that's the part.

Mayuri Diwan 6:54
Yeah, yeah, yeah.

Allen Zhang (DEVDIV) 6:55
OK.

Mayuri Diwan 6:56
Alan to take to take note of Peter's exact wording as a Microsoft project supported by community, and it should almost be a landing location is the way we should think about it. And.

Allen Zhang (DEVDIV) 6:58
Yep.
OK.
OK.

7:09
I.

Speaker 1 7:09
I don't even. I would say it's a community project sponsored by Microsoft.

7:12
Yes.

Mayuri Diwan 7:13
No. Yeah, that's at Peter's wording community project, and I'll leave that in the chat also.

7:17
Right.

Mayuri Diwan 7:17
Sorry, I misspoke myself. So Yep.

Allen Zhang (DEVDIV) 7:19
Yep.

Speaker 1 7:20
Right, so this is not a Microsoft product release.
This is a.
This is a community project and the main sponsor is Microsoft.
A.

Allen Zhang (DEVDIV) 7:29
Yeah. Perfect.

Speaker 2 7:32
Who's reviewing the blog post, by the way.

Allen Zhang (DEVDIV) 7:36
I reviewed it.
Brian's also have a couple comments and then he reviewed it.

Mayuri Diwan 7:40
I'm I'm looking at it as well.

Allen Zhang (DEVDIV) 7:41
Lori and Mayuri also looked at it. Yeah.

7:44
Here we go, OK.
OK.

Allen Zhang (DEVDIV) 7:46
Let me send the PR here. Yeah.

Mayuri Diwan 7:46
We should look.
We should loop you in as well, Matt.
We should loop you in as well.

Speaker 2 7:48
I'm happy to look at it too.

Allen Zhang (DEVDIV) 7:50
I'll send Apr to this chat shortly the afternoon meeting.

Speaker 1 7:56
My high level feedback on the blog that I saw was that.
It belts a bit.
Well, I it felt a bit like sales pitchy.
Like almost like a snake oil salesman.
Like almost like a snake oil.
Like trying to sell you something you didn't know you wanted.

8:16
Umm.
It's it's.

Speaker 1 8:19
This is does does that make sense?
This is does does that make?
Like if it was like using all kinds of buzzwords and trying to get people excited about things that I'm not sure we can, I'm not sure the product truth is there. Like like like the the the slogan like AP is at the speed of thought.

8:34
Oh God.

Speaker 1 8:35
Like like that feels like a stretch.
Like what are we really like?
Like what are we really?
What are we really trying to portray there?

Speaker 2 8:43
Especially if we're saying this is a community project and we want to give it a feeling of us.

Speaker 1 8:47
Right. Yeah, yeah, yeah.

Speaker 2 8:48
Great. As opposed to something we're trying to get you to buy?

Speaker 1 8:52
Yeah. So it felt very buzzy and like.

8:52
Yeah.
Yeah.

Speaker 1 8:54
It didn't feel like.
It didn't feel like it.

Allen Zhang (DEVDIV) 8:55
OK.

Speaker 1 8:56
It wasn't like, yeah, it wasn't.
It wasn't like, yeah, it.
Hey guys we have this cool thing we'd love you to know about it.
Love you to try it.
Love you to.
Give your feedback on it.
Give your feedback on.
We're about to make it to 10. You know, we we're very excited about it ourselves, but we really wanna hear from you.
Why? Why you?
Why? Why?
How you might use this tool to better your lives? Like right now we're saying like if you use this, you're gonna be amazing at API developers and you're gonna move faster than you've ever imagined. And I don't think that's what we're offering here.
Actually, don't think we have that product truth right now.

9:27
So.

Allen Zhang (DEVDIV) 9:27
That's great feedback.

Speaker 1 9:30
I think I would reading reading it through. I want to make sure that when they read the article and then they go use the product, they didn't get two different things.

Allen Zhang (DEVDIV) 9:30
OK.

9:39
Right.

Speaker 2 9:39
It didn't cure cancer, right?

Speaker 1 9:44
I don't wanna over promise.

9:45
And.

Speaker 1 9:45
And be like, what are these people talking about?

Allen Zhang (DEVDIV) 9:49
OK.
With them, we we still have time left.
Four days. So I'll. Yeah, I'll take this and then, yeah, I I I kind of.
What, Peter? What you said kind of resonant with me, so, but it didn't. Yeah.

Speaker 1 10:06
Can we all add one more thing can we get?

Allen Zhang (DEVDIV) 10:06
Yeah.

Speaker 1 10:09
In any way for this for this release?
It's not for the RC.
It's not for the.
Maybe it's for the next wave, but we have some very, very happy customers using type spec.
Can we get quotes from them about how how has improved their workflow or how?
Having the community that we're trying to work with be our best advocates, I think is a way to approach this.

Speaker 2 10:35
This general we even have quotes from inside Microsoft that really helps so.

Speaker 1 10:38
Yeah, we have Alps inside and outside, yeah.
'Cause I wanna make it like we're not announcing something. That's just great for us.
Announcing something that a bunch of people agree.
Is something for. For that they could benefit from so.

Mayuri Diwan 10:53
And Peter, you want that in the blog or is that what?

Speaker 1 10:57
Well, I think it's being in the.
Well, I think it's being in.
I think having messages from others in the blog would be powerful.

Mayuri Diwan 11:02
Or even on the website or something like that. Because I do think we have some of them already.

Speaker 1 11:02
I don't run it down the website.

11:06
Yeah, that.

Speaker 1 11:08
On the website too, and I, Brian and I have also been talking about getting like like if you go to open Ai's website.
Or sorry stainless website.
Or sorry stainless.
They have a long list of companies on them about who uses them.

Mayuri Diwan 11:17
Mm hmm.

Speaker 1 11:19
It's a very start upy thing to do, to have a list of your partner companies that are leveraging typespec.

Mayuri Diwan 11:24
Hold on.

Speaker 1 11:26
Think I think we should be thinking about that too, just from a Community projects perspective.
Do we communicate from the Community's perspective?

Mayuri Diwan 11:33
Mm hmm.

Speaker 1 11:34
Who uses us?

Speaker 2 11:34
You're really going from a garage town here, you know?
This.

Speaker 1 11:39
Is the Microsoft meeting as corporate whatever like this is we're trying to build an evangelist group from the bottom up.

Allen Zhang (DEVDIV) 11:39
So.

11:39
Yeah, yeah.

Allen Zhang (DEVDIV) 11:46
Hmm.

Mayuri Diwan 11:47
OK, I have actually posted stainless's side where they are showcasing that. I'll talk to Allen Mario, Lori's here.
We'll talk to Brian as well.
We'll, Brian and we'll try to get some.

11:55
I.

Speaker 1 11:55
I think it's also interesting 'cause we can put open AI on that page.
Open to guys.net SDK uses types.

Mayuri Diwan 12:00
Mm hmm.

12:01
Next.

Lori Fraleigh 12:02
We we can't.

Allen Zhang (DEVDIV) 12:05
The yeah.

Lori Fraleigh 12:05
We can't put the company on the page without their permission.

Allen Zhang (DEVDIV) 12:08
Yeah, we.

12:08
We can.

Mayuri Diwan 12:09
Yeah, we can talk to them. I think that's why we are not doing it now.

12:11
Yeah.

Mayuri Diwan 12:11
That's why Peter is saying don't do it in the next four days.
But this is something that over a period of time should be an added like we can put Azure on it because we can go to at least few teams.

12:19
Right.

Mayuri Diwan 12:20
I can put like somebody from lifter on it.
I can probably put Morgan Stanley if they are OK with like, but eventually yes. Open AI is a candidate.

12:23
Are.

Allen Zhang (DEVDIV) 12:27
Mm hmm.

Speaker 1 12:28
London London Stock Exchange.
London, London.
Stock Exchange, like there's all kinds of these companies that are using it.

Mayuri Diwan 12:32
Yes.

Speaker 2 12:32
Yeah, we have good quotes from from ARM and and from some other people up there. So uh, graph.

Mayuri Diwan 12:35
Correct.

Speaker 1 12:40
Yeah. Yeah. But I think that, I guess you guys, you're getting the tone that I'm hoping we can start to think about it.

Mayuri Diwan 12:45
Mm H.

Speaker 1 12:47
Do we?
Do.
How do we show the product led evangelism like people are using it?
It's good.
Not because we.
Not because we sell it.

Mayuri Diwan 12:58
Sounds good.

Allen Zhang (DEVDIV) 12:59
OK.

Mayuri Diwan 13:03
I'll take a look at the site I, Justin.

Allen Zhang (DEVDIV) 13:05
Yeah.

Speaker 1 13:10
Zuplo Zooplo was another company.
Zuplo Zooplo was another.
That was they have YouTube videos about how they use type spec.

13:17
OK.

Speaker 1 13:21
And actually, by the way, if you go to the GitHub page and then you go to the right hand side and you say like uses. If you look at the uses tab.
You'll find that there's a whole bunch of repos that use typespec that have a lot of stars.
And you can start to see that there are other people out there that are using typespec and we could probably reach out to them as well. You guys are popular.
Like most seems like phenoms loves.
Loves type spec like a bunch of the projects are like random vs LS for describing transactional data or.
Go ahead with next. Sorry, derailed.

Allen Zhang (DEVDIV) 14:12
OK.
OK.
Great feedback.
And then Peter, I have on the server streamlining, I saw the video.
I have the video from Mark but we all the time I will post it here and the JS 10. I think it doesn't change a whole lot really from the C# one you will get.
Effectively the same feel with the JS, but I'll I'll if that's recorded. I'll also send it here as well.
As I discuss with you in the chat, their follow up works and this is obviously not to the the I you know your idea or my idea is yet there still some gaps. We are actually having looking at a feature that we want to well designed out so.
That's gonna be afterwards after Azi. But it's already have a clear instructions we.
Trimmed down, we improved the init.
Ux experience.
The scaffolding is clearly instructed to the user, albeit right now it's as a still as a follow up step.
We have a work design work item to to incorporate into our TSP command and that's currently our direction to design it, but we won't be able to make it into the RC at this point.
So that's all I have for today.
01 more thing, Mike actually give you a heads up.
Kim and I were looking at the A set of package versioning proposal.
This doesn't have to be an RC, but I I think it could help us to.
Really standardize among all of the packages we've been publishing to establish some patterns. Right now we have mixture of 0 dot X and then now we also have one dot X.
And then there is a dash dev.
There is Dash alpha, you know, create some kind of structure I think.
We'll bring a lot of the clarity, but that was same proposal but.

16:30
Yep.

Allen Zhang (DEVDIV) 16:33
Watch out for that.
We'll create a loop or just. I'll send it to you for review.

Speaker 3 16:39
Yeah. I mean the only thing I can say to that without you know, getting too much into details would be like I think as much as possible we should try.

16:45
To.

Speaker 3 16:45
Copy an existing similar product that's successful you.
Copy an existing similar product that's successful, you know.
So if we want to copy typescript's versioning or the Azure SDK for JS versioning scheme, I mean, if either one of those makes sense like you know, let's not reinvent the wheel.

Allen Zhang (DEVDIV) 16:50
Yep.

Speaker 3 16:57
Know this is a little bit tricky because there's not, I mean.
I learned when I worked with Brian like on address keeper JS and stuff.
There's unfortunately not like.

17:06
One way that.

Speaker 3 17:09
Every npm package kinda does their previews a little bit differently.
Every npm package kinda does their previews a little bit.
There's not like 1 standard, Unfortunately, so we just need to kinda pick one that like to.
There's not like 1 standard, Unfortunately, so we just need to kinda pick one that like.

Allen Zhang (DEVDIV) 17:14
Yep.

Speaker 3 17:15
Maybe TypeScript is using or someone that we think that customers already know and like, and then we can just say, OK, we're doing the same thing they are, that that'd be my, you know, high level proposals.

Allen Zhang (DEVDIV) 17:23
Mm hmm.
Yeah. Yeah, we we do have the complexity.
We we release a whole slew of supporting package libraries emitters. Almost. It's only ecosystem.
I I think the new proposal will bring.
Standardization of all the library we own.
Umm, I wish we had, you know, introduced earlier 'cause that could solve some of our headache. What we had before, but.
But anyway, watch for. Watch out for that one.
Sweet. That's solidify.
Work with Shanghai.
Then we can start implementing that, but right now it's doing draft state.

Speaker 2 18:00
I have a question and I don't have a set answer in mind for this one.
I have a question and I don't have a set answer in mind for this.
Honestly, we have a certain set of blessed emitters that are that are going out do this lock step on version with. OK, so they're the same version. OK, got it. Perfect. All right.

Allen Zhang (DEVDIV) 18:09
Yep.
Correct. Correct. Yeah.

Speaker 3 18:17
Well, I mean I I think depending what this file proposal looks like and stuff, I mean we.
Wanna look at? I mean, there's.
It's gonna be interesting to see like, like in what cases?
Like, I mean if we if we align the version numbers and customers use all the same version numbers, it'll almost certainly work.
Like, I mean if we if we align the version numbers and customers use all the same version numbers, it'll almost certainly.
Yeah, but if we don't force them to do that, you know what happens if they start mixing and matching like, oh, for example, I'm.

18:36
It's like.
It's.

Speaker 2 18:39
As many of you know, I have this Zod emitter and we're working on an MCP emitter.
Those these automators actually up on npm right now as a preview version.
Those these automators actually up on npm right now as a preview.
It's it has its version number, has nothing to do right with with anything.
Question is if we ever finish this thing and made it official.
Would we expect that to to match and and and go out going forward?

19:02
What is?

Speaker 2 19:03
What is the process for saying this? Emitter is now a blessed thing and it it's now part of our in our core of of what we ship and it matches up right?

Speaker 3 19:06
That's a different question we have.

Allen Zhang (DEVDIV) 19:12
Yeah, definitely. If if we ship it and then the they will align.
So wait, wait till Matt. I'll also you know Laurent also.

19:22
Is.
It's not an.

Speaker 2 19:23
Important question right now by the way.
Important question right now by the.
I'm. I'm just this should not distract you.

Allen Zhang (DEVDIV) 19:25
Yep, Yep.

Speaker 2 19:27
Is something we can talk about later.
Is something we can talk about.
It's just something I wanted to throw out there.

Allen Zhang (DEVDIV) 19:33
Noted.

Speaker 1 19:34
At this point, I told Brian this too.
At this point, I told Brian this.
I want to be cautious about just pulling a bunch of things into the core if they're if they're out there and they're usable and we can list them on our page, as you know, community supported Project A blessed, blessed like we can have a graduation layers.

19:38
Yes.
The autom.
Got ready.

Speaker 1 19:50
But we should be able to.
But we should be able.

Allen Zhang (DEVDIV) 19:50
Yep.

19:51
Right.

Speaker 1 19:51
Talk about that kind of stuff makes make people aware of them.

19:53
Yeah.

Speaker 1 19:54
Them use them.
But that doesn't mean it has to be.

19:56
In the core, yeah.
I'm good.

Allen Zhang (DEVDIV) 19:58
Yeah, exactly.
We have been parsing all the, for example your meta framework as part of clean up, we've been moving things out to clear to provide clarity.
So and then by the way, I wanna show this page as well.
This was recently updated.
Umm.
Oh, Roland. Sorry.
Umm.
So as these emitters they will we will have badges and then we'll have Arthas around around us. So that give a clear indication of readiness, the standard library and then so that that's just minor one, but I think it's a it's worth noting and then really bring CLAR.

20:29
Oh.

Allen Zhang (DEVDIV) 20:42
To what you guys talking about?

Speaker 2 20:43
Yeah, we did something for emitters that would actually be pretty cool.

Allen Zhang (DEVDIV) 20:46
Yeah.

Speaker 3 20:47
But are we going to need any guidelines like around versioning and stuff or are we just hoping that if we send ver everything properly that you can mix and match after 10 and it'll be OK?

Allen Zhang (DEVDIV) 20:58
Well, wait till our proposal. I think you'll like it.

20:59
OK.

Allen Zhang (DEVDIV) 21:00
It actually bring a lot more standardization than than what we have currently, so yeah.

21:02
Aye.

Speaker 2 21:04
OK, but I like the direction that this is going though, so.
That's that's. That's cool.

Allen Zhang (DEVDIV) 21:12
OK.
We're at time right on the dot, so.
Cool.

Lori Fraleigh 21:18
Thank you everyone.

Allen Zhang (DEVDIV) 21:20
All right.
Thank you very much. Bye.

21:22
Yeah.
Where?

Lori Fraleigh stopped transcription
