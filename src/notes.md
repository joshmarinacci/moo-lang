The angles.


It happened again. The kids.., said john, wheezing as he pulled the door of the coffee shop almost from its hinges. "they disappeared again."


"'Disappeared' as in lost at the mall or 'disappeared' as in run away from home with their snacks in a bindle?", David replied without looking up from his laptop.

As in raptured. Stolen by gypsies. or beamed up into space.  

"I'm gonna need more of an explanation than that if I'm gonna help you", David said while taking off his glasses to clean them. "And what do you mean again? Is this common with them?"

I left them in the playroom while I took a nap and they were gone when I woke up.

Did you look outside for them? Five year olds wander off, you know.

Of course I dead, but the house was completely locked. Even the windows. And the security cameras showed nothing. There's no way they could have left without me knowing but they are gone! 

You have security cameras now?

Everywhere. Even the playroom showed nothing.

You put a camera in their playroom?  Are you stalking your own children?

I.., john stammered and looked around the room for words.  Um. After, well, you know I just couldn't take any chances.

David stood up, replaced his glasses, and embraced his brother in law.  She died of cancer, not spirited away by fairies. Camera's won't make them safer.  Now let's sit down and start from the beginning.

John, breathed heavily and signed, then sat down uncomfortably in the old plaid couch in the front room of David's coffee shop.  He glanced around to see if any of the staff or customers was looking at him, then lowered his voice.  "This isn't the first time it's happened", John said, almost whispering.

It's okay., David leaned in gently. They are smart kids. They'll always find a way to get out. Ellie did that when she was that age too. She was a little escape artist when she was that age too.

John shook his head. "No. It's not like that. They've escaped before. This is something different. It's like they left the house without even leaving their rooms.  Just vanished."

John hoped to get a bigger acknowledgment from David.   YOu don't believe me.

I do belive you, I just don't underst--

Here, look, john said while swiping furiously on his phone. Look here.  This is from 20 minutes ago. See they are playing find.

David slowly zoomed the image in and adjusted his glasses.  He saw his adorable niece and nephew playing with legos on the floor through what was clearly a grainy security camera placed on a shelf in their play room. John probably hid it in a teddy bear, David thought.  Okay. So?, he said, passing the phone back.

Now look at this. just 5 minutes later.  John scrubbed the video forward and shoved it in David's face.  They are gone but so what. They just walked out of frame. 

No, look again.  Step through it. The door to the hall never opens and the windows on the other side of the room are still locked from the inside.

David sighed then took the phone again, sliding back and forth to try to find something. tap tap tap. Children playing on the floor. David tapped one frame at a time, watching the kids get up and walk to the right, like an old flip book.   After a few seconds he felt a tingle in his brain and paused, No wait. He backed up two seconds and tapped forward again.  His brain was trying to tell him something.  There *is* something odd here, he thought. 

David shifted his weight and changed his grip on the phone, backing up again and zooming in a little closer. He could see his nephews eyes as the child stepped to the right. tap forward. nothing changed. static room. tap forward. nothing changed.  a few more taps and.. something.  something is different.  he backed up three frames again and stepped forward.  there. there it is. a flash.

Look, david yelled, then suddenly recoiling from the sound of his own loud voice.  Right here, just a few seconds after they move out of the camera, there's a brightening. Something bright to the side, just a couple of frames long. But something's there.  

See, you see! I'm not crazy.

Hold on. Can you get the raw footage from your cameras? I think so. The app only shows the highlights but everything should be on the camera itself.

Great, I'll let's go back to your house and take a look. I've got an investor meeting in five minutes. I'll meet you at the house in one hour.

One hour! My kids are gone. I can't wait one hour. 

I know, I know, but if they haven't left the room then they must still be in there, somewhere.  Go back and look to see if there's any secret openings, like an air vent or a crawlspace. I'll be there in one hour.

Okay, okay, John sighed. Realizing for the first time that he must seem like a crazy person.



```typescript

let Digit = Range("0","9");
let Letter = Or(Range("A","Z"),Range("a","z"))
let AlphaNum = Or(Digit, Letter)
let Integer = OneOrMore(Digit)
let Float = Seq(OneOrMore(Digit),Lit("."),OneOrMore(Digit))
let Identifier = Seq(One(Letter),ZeroOrMore(Or(AlphaNum)))
let QQ = Seq('"')
let Period = Seq('.')
let StringLit = Seq(QQ,AnyNot(QQ),QQ)
let Group = Seq(LeftParen,Exp,RightParen)
let Statement = Seq(ZeroOrMore(Exp),Period)
let Block = Seq(LeftBracket,ZeroOrMore(Statement), RightBracket)
let Space = Or(Lit(" "),Lit("\n"))

let Literal = Or(StringLit, Integer, Float) 
let SExp = Or(Literal, Identifier, Group, Block)
let Exp = Seq(ZeroOrMore(Space),SExp)


test("foo",() => {
    assert.equals(parse("42"),LitInt(42))
    assert.equals(parse("8_8"),LitInt(88))
    assert.equals(parse("0"),LitInt(0))
    
    assert.equals(parse("0.0"),LitFloat(0.0))
    assert.equals(parse("12.345"),LitFloat(12.345))
    assert.equals(parse("a.0"),Error())
    
    assert.equals(parse("abc123"),Ident("abc123"))
    assert.equals(parse("abc_def"),Ident("abc_def"))
    assert.equals(parse("12abc"),Error())

    assert.equals(parse('"this is a string"'),LitString("this is a string"))

    assert.equals(parse("(4)"),Group(LitInt(4)))
    assert.equals(parse("(4 add 5)"),Group(LitInt(4),Ident("add"),LitInt(5)))
    assert.equals(parse("4 add 5."),Statement(LitInt(4),Ident("add"),LitInt(5)))
    assert.equals(parse("[4 add 5.]"),Block(Statement(LitInt(4),Ident("add"),LitInt(5))))
})

```





