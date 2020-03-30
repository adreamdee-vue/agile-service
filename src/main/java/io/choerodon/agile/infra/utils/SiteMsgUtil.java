package io.choerodon.agile.infra.utils;

import com.alibaba.fastjson.JSONObject;
import io.choerodon.agile.api.vo.ProjectVO;
import io.choerodon.agile.app.service.UserService;
import io.choerodon.agile.infra.feign.BaseFeignClient;
import io.choerodon.agile.infra.feign.NotifyFeignClient;
import io.choerodon.core.notify.NoticeSendDTO;
import io.choerodon.core.notify.WebHookJsonSendDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Created by HuangFuqiang@choerodon.io on 2018/10/8.
 * Email: fuqianghuang01@gmail.com
 */
@Component
public class SiteMsgUtil {

    private static Logger LOGGER = LoggerFactory.getLogger(SiteMsgUtil.class);

    private static final String ASSIGNEENAME = "assigneeName";
    private static final String SUMMARY = "summary";
    private static final String URL = "url";
    private static final String NOTIFY_TYPE = "agile";
    private static final String PROJECT_NAME = "projectName";

    @Autowired
    private NotifyFeignClient notifyFeignClient;
    @Autowired
    private BaseFeignClient baseFeignClient;
    @Autowired
    private UserService userService;

    public void issueCreate(List<Long> userIds,String userName, String summary, String url, Long reporterId, Long projectId) {
        ProjectVO projectVO = baseFeignClient.queryProject(projectId).getBody();
        NoticeSendDTO noticeSendDTO = new NoticeSendDTO();
        noticeSendDTO.setCode("issueCreate");
        noticeSendDTO.setNotifyType(NOTIFY_TYPE);
        Map<String, Object> params = new HashMap<>();
        params.put(ASSIGNEENAME, userName);
        params.put(SUMMARY, summary);
        params.put(URL, url);
        params.put(PROJECT_NAME, projectVO.getName());
        noticeSendDTO.setParams(params);
        List<NoticeSendDTO.User> userList = new ArrayList<>();
        for (Long id : userIds) {
            NoticeSendDTO.User user = new NoticeSendDTO.User();
            user.setId(id);
            userList.add(user);
        }
        noticeSendDTO.setTargetUsers(userList);
        NoticeSendDTO.User fromUser = new NoticeSendDTO.User();
        fromUser.setId(reporterId);
        noticeSendDTO.setFromUser(fromUser);
        noticeSendDTO.setSourceId(projectId);
        // 添加webhook
        WebHookJsonSendDTO webHookJsonSendDTO = new WebHookJsonSendDTO();
        webHookJsonSendDTO.setObjectKind("issueCreate");
        webHookJsonSendDTO.setEventName("问题创建");
        webHookJsonSendDTO.setObjectAttributes((JSONObject) JSONObject.toJSON(params));
        webHookJsonSendDTO.setCreatedAt(new Date());
        webHookJsonSendDTO.setUser(userService.getWebHookUserById(reporterId));
        try {
            notifyFeignClient.postNotice(noticeSendDTO);
        } catch (Exception e) {
            LOGGER.error("创建issue消息发送失败", e);
        }
    }

    public void issueAssignee(List<Long> userIds, String userName, String summary, String url, Long assigneeId, Long projectId) {
        ProjectVO projectVO = baseFeignClient.queryProject(projectId).getBody();
        NoticeSendDTO noticeSendDTO = new NoticeSendDTO();
        noticeSendDTO.setCode("issueAssignee");
        noticeSendDTO.setNotifyType(NOTIFY_TYPE);
        Map<String, Object> params = new HashMap<>();
        params.put(ASSIGNEENAME, userName);
        params.put(SUMMARY, summary);
        params.put(URL, url);
        params.put(PROJECT_NAME, projectVO.getName());
        noticeSendDTO.setParams(params);
        List<NoticeSendDTO.User> userList = new ArrayList<>();
        for (Long id : userIds) {
            NoticeSendDTO.User user = new NoticeSendDTO.User();
            user.setId(id);
            userList.add(user);
        }
        noticeSendDTO.setTargetUsers(userList);
        NoticeSendDTO.User fromUser = new NoticeSendDTO.User();
        fromUser.setId(assigneeId);
        noticeSendDTO.setFromUser(fromUser);
        noticeSendDTO.setSourceId(projectId);
        // 添加webhook
        WebHookJsonSendDTO webHookJsonSendDTO = new WebHookJsonSendDTO();
        webHookJsonSendDTO.setObjectKind("issueAssignee");
        webHookJsonSendDTO.setEventName("问题分配");
        webHookJsonSendDTO.setObjectAttributes((JSONObject) JSONObject.toJSON(params));
        webHookJsonSendDTO.setCreatedAt(new Date());
        webHookJsonSendDTO.setUser(userService.getWebHookUserById(assigneeId));
        try {
            notifyFeignClient.postNotice(noticeSendDTO);
        } catch (Exception e) {
            LOGGER.error("分配issue消息发送失败", e);
        }
    }

    public void issueSolve(List<Long> userIds, String userName, String summary, String url, Long assigneeId, Long projectId) {
        ProjectVO projectVO = baseFeignClient.queryProject(projectId).getBody();
        NoticeSendDTO noticeSendDTO = new NoticeSendDTO();
        noticeSendDTO.setCode("issueSolve");
        noticeSendDTO.setNotifyType(NOTIFY_TYPE);
        Map<String, Object> params = new HashMap<>();
        params.put(ASSIGNEENAME, userName);
        params.put(SUMMARY, summary);
        params.put(URL, url);
        params.put(PROJECT_NAME, projectVO.getName());
        noticeSendDTO.setParams(params);
        List<NoticeSendDTO.User> userList = new ArrayList<>();
        for (Long id : userIds) {
            NoticeSendDTO.User user = new NoticeSendDTO.User();
            user.setId(id);
            userList.add(user);
        }
        noticeSendDTO.setTargetUsers(userList);
        NoticeSendDTO.User fromUser = new NoticeSendDTO.User();
        fromUser.setId(assigneeId);
        noticeSendDTO.setFromUser(fromUser);
        noticeSendDTO.setSourceId(projectId);
        // 添加webhook
        WebHookJsonSendDTO webHookJsonSendDTO = new WebHookJsonSendDTO();
        webHookJsonSendDTO.setObjectKind("issueSolve");
        webHookJsonSendDTO.setEventName("问题完成");
        webHookJsonSendDTO.setObjectAttributes((JSONObject) JSONObject.toJSON(params));
        webHookJsonSendDTO.setCreatedAt(new Date());
        webHookJsonSendDTO.setUser(userService.getWebHookUserById(assigneeId));
        try {
            notifyFeignClient.postNotice(noticeSendDTO);
        } catch (Exception e) {
            LOGGER.error("完成issue消息发送失败", e);
        }
    }

}
