/*
 * handleRequestsMain.cpp
 *
 *  Created on: Feb 17, 2016
 *      Author: hesham
 */
/*
 UNIX Daemon Server Programming Sample Program
 Levent Karakas <levent at mektup dot at> May 2001

 To compile:	cc -o exampled examped.c
 To run:		./exampled
 To test daemon:	ps -ef|grep exampled (or ps -aux on BSD systems)
 To test log:	tail -f /tmp/exampled.log
 To test signal:	kill -HUP `cat /tmp/exampled.lock`
 To terminate:	kill `cat /tmp/exampled.lock`
 */
#include <stdio.h>
#include <cstdlib>
#include <fcntl.h>
#include <sys/stat.h>
#include <linux/stat.h>
#include <errno.h>
#include <sys/wait.h>
#include <signal.h>
#include "homeCloud_ReqProcessor.h"
#define RUNNING_DIR	"/tmp"
#define LOCK_FILE	"exampled.lock"
#define LOG_FILE	"exampled.log"
#define FIFO_FILE       "/tmp/MYFIFO"
using namespace std;
// get sockaddr, IPv4 or IPv6:

#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <iostream>
#include <fstream>

#include <sys/mount.h>

#include "homeCloud_Utils.h"
//#endif
//#define PORT "9034"   // port we're listening on
void *get_in_addr_(struct sockaddr *sa);
void *get_in_addr_(struct sockaddr *sa)
{
    if (sa->sa_family == AF_INET) {
        return &(((struct sockaddr_in*)sa)->sin_addr);
    }

    return &(((struct sockaddr_in6*)sa)->sin6_addr);
}
int listen_for_uploads(void);

void mountFlashDrive() {
	const string fname="mountFlashDrive";
	PRNT_LOG("Called");
	int num_of_devices = atoi(CONF["homecloud_server.mount.num_of_devices"].c_str());
	for(int i =1;i<= num_of_devices;i++){
		PRNT_LOG("Mounting drive:" << CONF["homecloud_server.mount.source." + SSTR(i)] << " to:" <<CONF["homecloud_server.mount.target." + SSTR(i)]);
		if (mount(CONF["homecloud_server.mount.source." + SSTR(i)].c_str(),
				CONF["homecloud_server.mount.target." + SSTR(i)].c_str(),
				CONF["homecloud_server.mount.filesystemtype." + SSTR(i)].c_str(),
				MS_NOATIME, NULL)) {
			if (errno == EBUSY) {
				PRNT_LOG("Mountpoint busy...seems to be already connected!");
				return;
			} else {
				PRNT_LOG("Mount error: " << strerror(errno));
				exit(0);
			}
		} else {
			PRNT_LOG("Mount successful");
		}
	}
}
void umountFlashDrive() {
	const string fname="umountFlashDrive";
	int num_of_devices = atoi(CONF["homecloud_server.mount.num_of_devices"].c_str());
	for(int i =1;i<= num_of_devices;i++){
		int status;
		status = umount(CONF["homecloud_server.mount.target." + SSTR(i)].c_str());
		PRNT_LOG("USB unmounting "<< CONF["homecloud_server.mount.target." + SSTR(i)] << " - status = "<< strerror(errno));
	}
}

int listen_for_uploads(void)
{

	string fname="listen_for_uploads";
	printf("listen_for_uploads\n");
	Request_wrapper req_wrapper;
    fd_set master;    // master file descriptor list
    fd_set read_fds;  // temp file descriptor list for select()
    int fdmax;        // maximum file descriptor number

    int listener;     // listening socket descriptor
    int newfd;        // newly accept()ed socket descriptor
    struct sockaddr_storage remoteaddr; // client address
    socklen_t addrlen;

    char buf[550];    // buffer for client data
    int nbytes;

    char remoteIP[INET6_ADDRSTRLEN];

    int yes=1;        // for setsockopt() SO_REUSEADDR, below
    int i, j, rv;

    struct addrinfo hints, *ai, *p;

    FD_ZERO(&master);    // clear the master and temp sets
    FD_ZERO(&read_fds);

    // get us a socket and bind it
    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_flags = AI_PASSIVE;
    PRNT_LOG("About to start listenning on port:" <<CONF["homecloud_server.networking.filesport"].c_str());
    if ((rv = getaddrinfo(NULL, CONF["homecloud_server.networking.filesport"].c_str(), &hints, &ai)) != 0) {
        fprintf(stderr, "selectserver: %s\n", gai_strerror(rv));
        exit(1);
    }

    for(p = ai; p != NULL; p = p->ai_next) {
        listener = socket(p->ai_family, p->ai_socktype, p->ai_protocol);
        if (listener < 0) {
            continue;
        }

        // lose the pesky "address already in use" error message
        setsockopt(listener, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(int));

        if (bind(listener, p->ai_addr, p->ai_addrlen) < 0) {
            close(listener);
            continue;
        }

        break;
    }

    // if we got here, it means we didn't get bound
    if (p == NULL) {
        fprintf(stderr, "selectserver: failed to bind\n");
        exit(2);
    }

    freeaddrinfo(ai); // all done with this

    // listen
    if (listen(listener, 10) == -1) {
        perror("listen");
        exit(3);
    }

    // add the listener to the master set
    FD_SET(listener, &master);

    // keep track of the biggest file descriptor
    fdmax = listener; // so far, it's this one

    // main loop
    for(;;) {
        read_fds = master; // copy it
        if (select(fdmax+1, &read_fds, NULL, NULL, NULL) == -1) {
            perror("select");
            exit(4);
        }

        // run through the existing connections looking for data to read
        for(i = 0; i <= fdmax; i++) {
            if (FD_ISSET(i, &read_fds)) { // we got one!!
                if (i == listener) {
                    // handle new connections
                    addrlen = sizeof remoteaddr;
                    newfd = accept(listener,(struct sockaddr *)&remoteaddr,&addrlen);

                    if (newfd == -1)
                    {
                        perror("accept");
                    }
                    else
                    {
                        FD_SET(newfd, &master); // add to master set
                        if (newfd > fdmax)
                        {    // keep track of the max
                            fdmax = newfd;
                        }
                        printf("selectserver: new connection from %s on ""socket %d\n",inet_ntop(remoteaddr.ss_family,get_in_addr_((struct sockaddr*)&remoteaddr),remoteIP, INET6_ADDRSTRLEN),newfd);
                        // create file
                        req_wrapper.queue_socket_opaque(newfd);
                    }
                }
                else
                {

                	memset(buf,0,sizeof(buf));

                    // handle data from a client
                    if ((nbytes = recv(i, buf, sizeof buf, MSG_DONTWAIT )) <= 0)
                    {

                    	PRNT_LOG("[Socket "<<i <<"] data received from buffer in bytes:" << nbytes);
                    	//req_wrapper[i].add_data_chunk(buf,nbytes);
                        // got error or connection closed by client
                    	if(req_wrapper[i].get_op_type() == op_type_download){
                    		PRNT_LOG("download connection disconnected...won't do anything and leave it to the child to do it");
//                    		close(i); // bye!
//							FD_CLR(i, &master); // remove from master set
//							memset(buf,0,sizeof(buf));
                    		continue;
						}
                    	if(req_wrapper[i].get_op_type() == op_type_upload){
                    		req_wrapper[i].finish_receiving();
                    	}
                    	req_wrapper.dequeue_socket_opaque(i);
                        if (nbytes == 0)
                        {
                            // connection closed
                        	PRNT_LOG("[Socket "<<i <<"] selectserver: socket "<<i<<" hung up");
                        }
                        else
                        {
                            perror("recv");
                        }

                        close(i); // bye!
                        FD_CLR(i, &master); // remove from master set
                        memset(buf,0,sizeof(buf));
                    }
                    else {
                    //	PRNT_LOG("[Socket "<< i <<"] we got "<<nbytes<<" bytes from a client");
                    	req_wrapper[i].add_data_chunk(buf,nbytes);
                    	if(req_wrapper[i].get_session_status() == Not_Valid_session ||req_wrapper[i].get_op_type() ==  op_type_not_exist){
                    		PRNT_LOG("The session is not valid! closing it: Session Status:" << req_wrapper[i].get_session_status()
					 << " Operation type is:" << req_wrapper[i].get_op_type() );
                    		//sesson is not valid!
                    		stringstream header;
							header <<  "HTTP/1.1 200 OK\r\n"
								"Content-Type: plain/text\r\n" <<
						//			"Content-Description: File Transfer\r\n"<<
									"Connection: Close\r\n"<<
						//			"Content-Disposition: attachment; filename= "<< this->getFileName()<<"\r\n"<<
						//			"Content-Transfer-Encoding: binary\r\n"<<
						//			"Expect: 100-continue\r\n"<<
						//			"Pragma: public\r\n"<<
								"Content-Length: "<< 4 <<"\r\n\r\n" << "FAIL";
							send(i,header.str().c_str(),header.str().length(),MSG_NOSIGNAL);
                            close(i); // bye!
                            FD_CLR(i, &master); // remove from master set
                            //req_wrapper[i].finish_receiving();
                            //req_wrapper.dequeue_socket_opaque(i);
                            continue;
                    	}
                    	if(req_wrapper[i].get_op_type() == op_type_download && req_wrapper[i].get_session_status() == Valid_session){
                    		/*if the user wants to download - then return this info to the main loop so it will fork a child that handle the process and then closes the socket*/
                    		PRNT_LOG("Starting download...");
                    		int pid  = fork();
                    		if(pid == 0){
                    			// this is the child
                    			if(!req_wrapper[i].send_file_to_client()){
                    			    // send failure
                    			    stringstream header;
					    header <<  "HTTP/1.1 404 Not Found\r\n"
						"Content-Type: plain/text\r\n" <<
									    "Connection: Close\r\n"<<
						"Content-Length: "<< 4 <<"\r\n\r\n" << "FAIL";

					    send(i,header.str().c_str(),header.str().length(),MSG_NOSIGNAL);
                    			}
                    			PRNT_LOG("Finished sending...closing socket.");
                    			close(i); // bye!
                    			//FD_CLR(i, &master); // remove from master set
                    			req_wrapper.dequeue_socket_opaque(i);
                    			exit(0); // child exit after job finished!
                    		}
                    		FD_CLR(i, &master); /* dont monitor this socket, child is working on it and mathar yakar dooooont*/
                    		memset(buf,0,sizeof(buf));
                    		continue;
                    	}
                    	if(req_wrapper[i].get_op_type() == op_type_rename_file&& req_wrapper[i].get_session_status() == Valid_session){
				PRNT_LOG("Rename file...");
				int pid  = fork();
				if(pid == 0){
					// this is the child
					req_wrapper[i].rename_file();
					PRNT_LOG("Finished renaming file");
					stringstream header;
					header <<  "HTTP/1.1 200 OK\r\n"
					    "Content-Type: plain/text\r\n" <<
									"Connection: Close\r\n"<<
					    "Content-Length: "<< 7 <<"\r\n\r\n" << "SUCCESS";

				      send(i,header.str().c_str(),header.str().length(),MSG_NOSIGNAL);
					close(i); // bye!
					//FD_CLR(i, &master); // remove from master set
					req_wrapper.dequeue_socket_opaque(i);
					exit(0); // child exit after job finished!
				}
				FD_CLR(i, &master); /* dont monitor this socket, child is working on it and mathar yakar dooooont*/
				memset(buf,0,sizeof(buf));
				continue;
			}
                    	if(req_wrapper[i].is_file_received() == true){
                    		PRNT_LOG("[Socket "<<i <<"] file content all received");
                    		// file content all received
                    		stringstream data ;
                    		data <<  "{'_id':'" << req_wrapper[i].get_record_id() << "'}";
                    		stringstream header;
                    			header <<  "HTTP/1.1 200 OK\r\n"
                    			    "Content-Type: application/json\r\n" <<
									"Connection: Close\r\n"<<
                    			    "Content-Length: "<<
					    data.str().length()<<"\r\n\r\n" << data.str();

                    		send(i,header.str().c_str(),header.str().length(),MSG_NOSIGNAL);
							close(i); // bye!
							FD_CLR(i, &master); // remove from master set
							req_wrapper[i].finish_receiving();
							req_wrapper.dequeue_socket_opaque(i);
						}


                    	memset(buf,0,sizeof(buf));
                    }
                } // END handle data from client
            } // END got new incoming connection
        } // END looping through file descriptors
    } // END for(;;)--and you thought it would never end!

    return 0;
}
void log_message(string filename, string message) {
	FILE *logfile;
	logfile = fopen(filename.c_str(), "a");
	if (!logfile)
		return;
	fprintf(logfile, "%s\n", message.c_str());
	fclose(logfile);
}

void signal_handler(int sig) {
	switch (sig) {
	case SIGHUP:
		log_message(LOG_FILE, "hangup signal catched");
		break;
	case SIGTERM:
		log_message(LOG_FILE, "terminate signal catched");
		exit(0);
		break;
	}
}

void daemonize() {
	int i, lfp;
	char str[10];
	if (getppid() == 1) {
		return; /* already a daemon */
	}
	i = fork();
	if (i < 0) {
		exit(1); /* fork error */
	}
	if (i > 0) {
		exit(0); /* parent exits */
	}

	/* child (daemon) continues */
	setsid(); /* obtain a new process group */

	for (i = getdtablesize(); i >= 0; --i) {
		close(i); /* close all descriptors */
	}
	i = open("/dev/null", O_RDWR);
	//dup(i); dup(i); /* handle standart I/O */
	umask(027); /* set newly created file permissions */
	chdir(RUNNING_DIR); /* change running directory */

	lfp = open(LOCK_FILE, O_RDWR | O_CREAT, 0640);
	if (lfp < 0) {
		exit(1); /* can not open */
	}
	if (lockf(lfp, F_TLOCK, 0) < 0) {
		exit(0); /* can not lock */
	}
	/* first instance continues */
	sprintf(str, "%d\n", getpid());
	write(lfp, str, strlen(str)); /* record pid to lockfile */
	signal(SIGCHLD, SIG_IGN); /* ignore child */
	signal(SIGTSTP, SIG_IGN); /* ignore tty signals */
	signal(SIGTTOU, SIG_IGN);
	signal(SIGTTIN, SIG_IGN);
	signal(SIGHUP, signal_handler); /* catch hangup signal */
	signal(SIGTERM, signal_handler); /* catch kill signal */
	log_message(LOG_FILE, "here");
}
void start_listenning() {
//	log_message(LOG_FILE, "start_listenning");
//	FILE *fp;
//	char readbuf[80];
//
//	/* Create the FIFO if it does not exist */
//	umask(0);
//	mknod(FIFO_FILE, S_IFIFO | 0666, 0);
//
//	while (1) {
//		log_message(LOG_FILE, "loop");
//		fp = fopen(FIFO_FILE, "r");
//		fgets(readbuf, 80, fp);
//		//printf("Received string: %s\n", readbuf);
//		string json_req(readbuf);
//		log_message(LOG_FILE, "received the string " + json_req);
//		handle_server_request(request);
//		sleep(11);
//		fclose(fp);
//	}

}
void handle_server_request(const string& json_req) {
//	RequestWrapper req_wrap(json_req);
//	if (req_wrap.is_upload_file()) {
//
//	}
}
int main(void) {
	ConfigurationDictionary::getInstance()->initialize();
	printf("Welcome to the requests handler.3\n");
	mountFlashDrive();
	//daemonize();
	//start_listenning();
	//while(1){
	//	start_listenning();
	//	sleep(1); /* run */
	//}
	listen_for_uploads();
	return 0;
}

/* EOF */

