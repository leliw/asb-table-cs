FROM adoptopenjdk/openjdk11:latest
RUN addgroup spring 
RUN adduser --ingroup spring spring
USER spring:spring
ARG JAR_FILE=backend/target/*.jar
COPY ${JAR_FILE} app.jar
ENTRYPOINT ["java","-jar","/app.jar"]