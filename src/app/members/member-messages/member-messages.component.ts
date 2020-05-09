import {
  AfterViewChecked,
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef
} from "@angular/core"
import { AuthService } from "src/app/_services/auth.service"
import { Message } from "../../_models/message"
import { UserService } from "src/app/_services/user.service"
import { AlertifyService } from "src/app/_services/alertify.service"
import { tap } from "rxjs/operators"

@Component({
  selector: "app-member-messages",
  templateUrl: "./member-messages.component.html",
  styleUrls: ["./member-messages.component.css"]
})
export class MemberMessagesComponent implements OnInit, AfterViewChecked {
  @Input()
  recipientId: number
  @ViewChild("messageBoard", { static: true })
  messageBoard: ElementRef
  messages: Message[]
  newMessage: any = {}

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private alertify: AlertifyService
  ) {}

  ngOnInit(): void {
    this.loadMessages()
    this.scrollToBottom()
    setInterval(() => {
      this.loadMessages()
    }, 1000)
  }

  ngAfterViewChecked() {
    this.scrollToBottom()
  }

  scrollToBottom(): void {
    try {
      this.messageBoard.nativeElement.scrollTop = this.messageBoard.nativeElement.scrollHeight
    } catch (err) {}
  }

  loadMessages() {
    const currentUserId = +this.authService.decodedToken.nameid
    this.userService
      .getMessageThread(this.authService.decodedToken.nameid, this.recipientId)
      .pipe(
        tap(messages => {
          for (let i = 0; i < messages.length; i++) {
            if (
              !messages[i].isRead &&
              messages[i].recipientId === currentUserId
            ) {
              this.userService.markAsRead(currentUserId, messages[i].id)
            }
          }
        })
      )
      .subscribe(
        messages => {
          this.messages = messages.reverse()
        },
        error => {
          this.alertify.error(error)
        }
      )
  }

  sendMessage() {
    this.newMessage.recipientId = this.recipientId
    this.userService
      .sendMessage(this.authService.decodedToken.nameid, this.newMessage)
      .subscribe(
        (message: Message) => {
          this.messages.push(message)
          this.newMessage.content = ""
        },
        error => {
          this.alertify.error(error)
        }
      )
  }
}
