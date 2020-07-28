package io.choerodon.agile.infra.utils;

import java.io.IOException;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.alibaba.fastjson.JSON;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.choerodon.agile.api.vo.SearchSourceVO;
import io.choerodon.agile.api.vo.SearchVO;
import io.choerodon.agile.app.service.impl.SprintServiceImpl;
import io.choerodon.core.convertor.ApplicationContextHelper;
import io.choerodon.core.exception.CommonException;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.hzero.starter.keyencrypt.core.Encrypt;
import org.hzero.starter.keyencrypt.core.EncryptContext;
import org.hzero.starter.keyencrypt.core.EncryptProperties;
import org.hzero.starter.keyencrypt.core.EncryptionService;
import org.springframework.util.ObjectUtils;

/**
 * @author zhaotianxin
 * @date 2020-06-16 20:24
 */
public class EncryptionUtils {

    static EncryptionService encryptionService = new EncryptionService(new EncryptProperties());

    private static ObjectMapper objectMapper = new ObjectMapper();

    private static ObjectMapper encryptMapper;

    public static String[] FIELD_VALUE = {"remaining_time","story_points","creation_date","type_code"};

    public static String[] FILTER_FIELD = {"issueTypeId", "statusId", "priorityId", "component", "epic", "feature", "label", "sprint", "version","issueTypeList","epicList","piList","issueIds", "statusList"};

    public static String[] IGNORE_VALUES = {"0"};
    public static final String BLANK_KEY = "";

    /**
     * 解密serachVO
     *
     * @param search SearchVO
     */
    public static void decryptSearchVO(SearchVO search) {
        if (!EncryptContext.isEncrypt()){
            return;
        }
        Optional<Map<String, Object>> adMapOptional = Optional.ofNullable(search).map(SearchVO::getAdvancedSearchArgs);
        if (adMapOptional.isPresent()) {
            decryptAd(search, adMapOptional);
        }

        Optional<Map<String, Object>> searchArgs = Optional.ofNullable(search).map(SearchVO::getOtherArgs);
        if (searchArgs.isPresent()) {
            decryptOa(search, searchArgs);
        }
    }

    /**
     * 解密serachVO
     *
     * @param search SearchVO
     */
    @SuppressWarnings("unchecked")
    public static void decryptSearchParamMap(Map<String, Object> search) {
        if (!EncryptContext.isEncrypt()){
            return;
        }
        Optional<Map<String, Object>> adMapOptional = Optional.ofNullable((Map<String, Object>)search.get(SprintServiceImpl.ADVANCED_SEARCH_ARGS));
        if (!adMapOptional.isPresent()) {
            return;
        }
        for (Map.Entry<String, Object> entry : adMapOptional.get().entrySet()) {
            if (entry.getValue() instanceof String){
                ((Map<String, Object>) search.get(SprintServiceImpl.ADVANCED_SEARCH_ARGS))
                        .put(entry.getKey(), decrypt((String)entry.getValue(), BLANK_KEY));
            }
            if (entry.getValue() instanceof Collection){
                ((Map<String, Object>) search.get(SprintServiceImpl.ADVANCED_SEARCH_ARGS))
                        .put(entry.getKey(), decryptList((List<String>) entry.getValue(), BLANK_KEY, new String[]{"0"}));
            }

        }
    }


    /**
     * 对单个主键进行解密
     *
     * @param crypt
     * @param tableName
     * @return
     */
    public static Long decrypt(String crypt, String tableName) {
        if (StringUtils.isNumeric(crypt)) {
            return Long.parseLong(crypt);
        } else {
            return Long.parseLong(encryptionService.decrypt(crypt, tableName));
        }
    }

    public static String decrypt(String crypt) {
        return encryptionService.decrypt(crypt, BLANK_KEY);
    }

    /**
     * 解密List<String>形式的主键
     *
     * @param crypts
     * @param tableName
     * @return
     */
    public static List<Long> decryptList(List<String> crypts, String tableName, String[] ignoreValue) {
        List<Long> cryptsLong = new ArrayList<>();
        List<String> ignoreValueList = new ArrayList<>();
        if (!ArrayUtils.isEmpty(ignoreValue)) {
            ignoreValueList.addAll(Arrays.asList(ignoreValue));
        }
        if (!CollectionUtils.isEmpty(crypts)) {
            for (String crypt : crypts) {
                if (!CollectionUtils.isEmpty(ignoreValueList) && ignoreValueList.contains(crypt)) {
                    cryptsLong.add(Long.valueOf(crypt));
                } else {
                    cryptsLong.add(decrypt(crypt, tableName));
                }
            }
        }
        return cryptsLong;
    }

    /***
     * 处理List 对象
     * @param object
     * @param clazz
     * @return
     */
    public static List jsonToList(Object object, Class clazz) {
        List list = new ArrayList();
        try {
            JsonNode jsonNode = objectMapper.readTree(object.toString());
            if (jsonNode.isArray()) {
                Iterator<JsonNode> elements = jsonNode.elements();
                while (elements.hasNext()) {
                    JsonNode next = elements.next();
                    Object obj;
                    if (next.isObject()) {
                        obj = clazz.newInstance();
                        handlerObject(next.toString(), obj, clazz);
                    } else {
                        obj = objectMapper.readValue(next.toString(), clazz);
                    }
                    list.add(obj);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    /**
     * 处理Object 对象
     *
     * @param object
     * @param object
     * @param clazz
     */
    public static void handlerObject(String jsonString, Object object, Class clazz) {
        try {
            JsonNode jsonNode = objectMapper.readTree(jsonString);
            Iterator<String> fieldNames = jsonNode.fieldNames();
            while (fieldNames.hasNext()) {
                String fieldName = fieldNames.next();
                JsonNode valueNode = jsonNode.get(fieldName);
                Field field = null;
                try {
                    field = clazz.getDeclaredField(fieldName);
                    field.setAccessible(true);
                    if (field.getType() == String.class) {
                        field.set(object, valueNode.textValue());
                    } else if (field.getType() == Long.class) {
                        Encrypt encrypt = field.getAnnotation(Encrypt.class);
                        if (encrypt != null && !StringUtils.isNumeric(valueNode.textValue())) {
                            field.set(object, decrypt(valueNode.textValue(), encrypt.value()));
                        } else if (encrypt != null
                                && !ArrayUtils.isEmpty(encrypt.ignoreValue())
                                && Arrays.asList(encrypt.ignoreValue()).contains(valueNode.textValue())) {
                            field.set(object, Long.valueOf(valueNode.textValue()));
                        } else {
                            field.set(object, valueNode == null ? null : Long.valueOf(valueNode.toString()));
                        }
                    } else if (field.getType() == Date.class) {
                        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                        field.set(object, valueNode != null ? sdf.parse(valueNode.toString()) : null);
                    } else if (field.getType() == Integer.class) {
                        field.set(object, valueNode == null ? null : Integer.valueOf(valueNode.toString()));
                    } else if (field.getType() == BigDecimal.class) {
                        field.set(object, valueNode == null ? null : new BigDecimal(valueNode.toString()));
                    } else if (field.getType() == List.class) {
                        String className = field.getGenericType().getTypeName().substring(15, field.getGenericType().getTypeName().length() - 1);
                        Class<?> aClass = Class.forName(className);
                        List list = jsonToList(valueNode, aClass);
                        field.set(object, list);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static boolean isWrapClass(Class clz) {
        try {
            return ((Class) clz.getField("TYPE").get(null)).isPrimitive();
        } catch (Exception e) {
            return false;
        }
    }


    /**
     * 解密ad
     *
     * @param search        SearchVO
     * @param adMapOptional adMapOptional
     */
    @SuppressWarnings("unchecked")
    private static void decryptAd(SearchVO search, Optional<Map<String, Object>> adMapOptional) {
        List<String> temp;
        String tempStr;// versionList
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("versionList"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getAdvancedSearchArgs().put("versionList",
                    temp.stream().map(item -> Long.parseLong(encryptionService.decrypt(item, BLANK_KEY))).collect(Collectors.toList()));
        }
        // statusList
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("statusList"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getAdvancedSearchArgs().put("statusList",
                    temp.stream().map(item -> Long.parseLong(encryptionService.decrypt(item, BLANK_KEY))).collect(Collectors.toList()));
        }
        // components
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("components"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getAdvancedSearchArgs().put("components",
                    temp.stream().map(item -> Long.parseLong(encryptionService.decrypt(item, BLANK_KEY))).collect(Collectors.toList()));
        }
        // sprints
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("sprints"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getAdvancedSearchArgs().put("sprints",
                    temp.stream().map(item -> Long.parseLong(encryptionService.decrypt(item, BLANK_KEY))).collect(Collectors.toList()));
        }
        // statusIdList
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("statusIdList"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getAdvancedSearchArgs().put("statusIdList",
                    temp.stream().map(item -> Long.parseLong(encryptionService.decrypt(item, BLANK_KEY))).collect(Collectors.toList()));
        }
        // prioritys
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("prioritys"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getAdvancedSearchArgs().put("prioritys",
                    temp.stream().map(item -> Long.parseLong(encryptionService.decrypt(item, BLANK_KEY))).collect(Collectors.toList()));
        }

        // issueTypeId
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("issueTypeId"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getAdvancedSearchArgs().put("issueTypeId",
                    temp.stream().map(item -> Long.parseLong(encryptionService.decrypt(item, BLANK_KEY))).collect(Collectors.toList()));
        }

        // statusId
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("statusId"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getAdvancedSearchArgs().put("statusId",
                    temp.stream().map(item -> Long.parseLong(encryptionService.decrypt(item, BLANK_KEY))).collect(Collectors.toList()));
        }

        // priorityId
        tempStr = adMapOptional.map(ad -> {
            if (Objects.isNull(ad.get("priorityId"))){
                return null;
            }else if (ad.get("priorityId") instanceof String){
                return (String) (ad.get("priorityId"));
            }else {
                try {
                    return objectMapper.writeValueAsString(ad.get("priorityId"));
                } catch (JsonProcessingException e) {
                    throw new CommonException(e);
                }
            }
        }).orElse(null);
        if (StringUtils.isNotBlank(tempStr)) {
            handlerPrimaryKey(tempStr, "priorityId", search.getAdvancedSearchArgs());
        }
    }

    /**
     * 解密ad
     *
     * @param search        SearchVO
     * @param adMapOptional adMapOptional
     */
    @SuppressWarnings("unchecked")
    private static void decryptOa(SearchVO search, Optional<Map<String, Object>> adMapOptional) {
        List<String> temp;
        String tempStr;// versionList
        // priorityId
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("priorityId"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getOtherArgs().put("priorityId",
                    temp.stream().map(item -> encryptionService.decrypt(item, BLANK_KEY)).collect(Collectors.toList()));
        }

        // component
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("component"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getOtherArgs().put("component",
                    temp.stream().map(item -> encryptionService.decrypt(item, BLANK_KEY)).collect(Collectors.toList()));
        }

        // version
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("version"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getOtherArgs().put("version",
                    temp.stream().map(item -> encryptionService.decrypt(item, BLANK_KEY)).collect(Collectors.toList()));
        }

        // sprint
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("sprint"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getOtherArgs().put("sprint",
                    temp.stream().map(item -> encryptionService.decrypt(item, BLANK_KEY)).collect(Collectors.toList()));
        }

        // issueIds
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("issueIds"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getOtherArgs().put("issueIds",
                    temp.stream().map(item -> encryptionService.decrypt(item, BLANK_KEY)).collect(Collectors.toList()));
        }

        // label
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("label"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getOtherArgs().put("label",
                    temp.stream().map(item -> encryptionService.decrypt(item, BLANK_KEY)).collect(Collectors.toList()));
        }

        // componentIds
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("componentIds"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getOtherArgs().put("componentIds",
                    temp.stream().map(item -> encryptionService.decrypt(item, BLANK_KEY)).collect(Collectors.toList()));
        }

        // feature
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("feature"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getOtherArgs().put("feature",
                    temp.stream().map(item -> encryptionService.decrypt(item, BLANK_KEY)).collect(Collectors.toList()));
        }

        // epic
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("epic"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getOtherArgs().put("epic",
                    temp.stream().map(item -> encryptionService.decrypt(item, BLANK_KEY)).collect(Collectors.toList()));
        }

        // customField
        Object ob = adMapOptional.map(ad -> (Object) (ad.get("customField"))).orElse(null);
        if (!ObjectUtils.isEmpty(ob)) {
            search.getOtherArgs().put("customField",handlerCustomField(ob,false));
        }

        // assigneeId
        temp = adMapOptional.map(ad -> (List<String>) (ad.get("assigneeId"))).orElse(null);
        if (CollectionUtils.isNotEmpty(temp)) {
            search.getOtherArgs().put("assigneeId",
                    temp.stream().map(item -> Long.parseLong(encryptionService.decrypt(item, BLANK_KEY))).collect(Collectors.toList()));
        }
    }

    public static void handlerPrimaryKey(String tempStr, String key, Map<String, Object> map) {
        JsonNode jsonNode = null;
        try {
            jsonNode = objectMapper.readTree(tempStr);
            if (jsonNode.isArray()) {
                List list = objectMapper.readValue(tempStr, List.class);
                map.put(key, decryptList(list, BLANK_KEY, IGNORE_VALUES));
            } else {
                map.put(key, encryptionService.decrypt(tempStr, BLANK_KEY));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static List<String> encryptList(List<Long> parentIds) {
        List<String> list = new ArrayList<>();
        if (!CollectionUtils.isEmpty(parentIds)) {
            parentIds.forEach(v -> list.add(encryptionService.encrypt(v.toString(), BLANK_KEY)));
        }
        return list;
    }

    public static List<String> encryptListToStr(List<String> ids) {
        List<String> list = new ArrayList<>();
        if (!CollectionUtils.isEmpty(ids)) {
            ids.forEach(v -> list.add(encryptionService.encrypt(v, BLANK_KEY)));
        }
        return list;
    }

    public static Map<String, List<String>> encryptMap(Map<Long, List<Long>> parentWithSubs) {
        Map<String, List<String>> map = new HashMap<>();
        if (!parentWithSubs.isEmpty()) {
            Iterator<Map.Entry<Long, List<Long>>> iterator = parentWithSubs.entrySet().iterator();
            while (iterator.hasNext()) {
                Map.Entry<Long, List<Long>> next = iterator.next();
                map.put(encryptionService.encrypt(next.getKey().toString(), BLANK_KEY), encryptList(next.getValue()));
            }
        }
        return map;
    }

    public static String handlerFilterEncryptList(String value, boolean encrypt) {
        StringBuilder build = new StringBuilder("(");
        String[] split = subString(value);
        if (!ArrayUtils.isEmpty(split)) {
            List<String> list = Arrays.asList(split);
            for (String s : list) {
                build.append(encrypt ? encryptionService.encrypt(s, BLANK_KEY) : decrypt(s, BLANK_KEY));
                if (list.indexOf(s) != (list.size() - 1)) {
                    build.append(",");
                }
            }
        }
        build.append(")");
        return build.toString();
    }

    public static String[] subString(String value) {
        String regEx = "[()]";
        Pattern compile = Pattern.compile(regEx);
        Matcher matcher = compile.matcher(value);
        String replace = matcher.replaceAll("").trim();
        String[] split = replace.split(",");
        return split;
    }





    public static String handlerPersonFilterJson(String filterJson, boolean encrypt) {
        try {
            JsonNode jsonNode = objectMapper.readTree(filterJson);
            ObjectNode objectNode = objectMapper.createObjectNode();
            if (!ObjectUtils.isEmpty(jsonNode.get("advancedSearchArgs"))) {
                Map<String, Object> adMapOptional = objectMapper.readValue(objectMapper.writeValueAsString(jsonNode.get("advancedSearchArgs")), new TypeReference<Map<String, Object>>() {
                });
                objectNode.set("advancedSearchArgs",objectMapper.readTree(objectMapper.writeValueAsString(handlerOtherArgs(adMapOptional, encrypt))));
            } else {
                objectNode.set("advancedSearchArgs",objectMapper.readTree(objectMapper.writeValueAsString(new HashMap())));
            }
            if (!ObjectUtils.isEmpty(jsonNode.get("otherArgs"))) {
                Map<String, Object> oAMap = objectMapper.readValue(objectMapper.writeValueAsString(jsonNode.get("otherArgs")),new TypeReference<Map<String,Object>>(){});
                objectNode.set("otherArgs",objectMapper.readTree(objectMapper.writeValueAsString(handlerOtherArgs(oAMap, encrypt))));
            }
            else {
                objectNode.put("otherArgs", objectMapper.readTree(objectMapper.writeValueAsString(new HashMap())));
            }
            if(!ObjectUtils.isEmpty(jsonNode.get("quickFilterIds"))){
               List<String> list =  objectMapper.readValue(objectMapper.writeValueAsString(jsonNode.get("quickFilterIds")),new TypeReference<List<String>>() {});
               if(encrypt){
                   objectNode.set("quickFilterIds",objectMapper.readTree(objectMapper.writeValueAsString(encryptListToStr(list))));
               }
               else {
                   objectNode.set("quickFilterIds",objectMapper.readTree(objectMapper.writeValueAsString(decryptList(list,BLANK_KEY,null))));
               }
            }
            return objectMapper.writeValueAsString(objectNode);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private static Map<String, Object> handlerOtherArgs(Map<String, Object> map, boolean encrypt) {
        List<String> temp;
        List<String> list = Arrays.asList(FILTER_FIELD);
        Map<String, Object> map1 = new HashMap<>();
        Iterator<Map.Entry<String, Object>> iterator = map.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Object> next = iterator.next();
            Object object;
            if (list.contains(next.getKey())) {
                List<String> value = null;
                try {
                    value = objectMapper.readValue(objectMapper.writeValueAsString(next.getValue()),new TypeReference<List<String>>() { });
                } catch (IOException e) {
                    e.printStackTrace();
                }
                if (!CollectionUtils.isEmpty(value)) {
                    object = value.stream().map(v -> encrypt ? encryptionService.encrypt(v, BLANK_KEY) : encryptionService.decrypt(v, BLANK_KEY)).collect(Collectors.toList());
                }
                else {
                    object = new ArrayList<>();
                }
            } else if ("customField".equals(next.getKey())) {
                object = handlerCustomField(next.getValue(), encrypt);
            } else {
                object = next.getValue();
            }
            map1.put(next.getKey(), object);
        }
        return map1;
    }

    private static Object handlerCustomField(Object value, Boolean encrypt) {
        try {
            JsonNode jsonNode = objectMapper.readTree(objectMapper.writeValueAsString(value));
            ObjectNode objectNode = (ObjectNode) jsonNode;
            Iterator<Map.Entry<String, JsonNode>> fields = objectNode.fields();
            Map<String, Object> map = new HashMap<>();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> next = fields.next();
                JsonNode nextValue = next.getValue();
                List<Object> objects = new ArrayList<>();
                for (JsonNode node : nextValue) {
                    Map<String, Object> nodeObjValue = new HashMap<>();
                    String fieldId = node.get("fieldId").textValue();
                    nodeObjValue.put("fieldId", encrypt ? encryptionService.encrypt(fieldId, BLANK_KEY) : encryptionService.decrypt(fieldId, BLANK_KEY));
                    JsonNode value1 = node.get("value");
                    if ("option".equals(next.getKey())) {
                        List<String> list = new ArrayList<>();
                        if (value1.isArray()) {
                            value1.forEach(v -> {
                                list.add(v.isNumber() ? v.textValue() : (encrypt ? encryptionService.encrypt(v.textValue(), BLANK_KEY) : encryptionService.decrypt(v.textValue(), BLANK_KEY)));
                            });
                        }
                        nodeObjValue.put("value", list);
                    } else {
                        nodeObjValue.put("value", value1.textValue());
                    }
                    objects.add(nodeObjValue);
                }
                map.put(next.getKey(), objects);
            }
            return map;
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static <T> Map<String, Map<String, List<?>>> encryptMapValueMap(Map<Long, Map<Long, List<T>>> map) {
        Map<String, Map<String, List<?>>> mapHashMap = new HashMap<>();
        if(!ObjectUtils.isEmpty(map)){
            for (Map.Entry<Long,Map<Long,List<T>>> entry : map.entrySet()) {
                Long key = entry.getKey();
                Map<Long, List<T>> value = entry.getValue();
                Map<String,List<?>> stringListMap = new HashMap<>();
                for(Map.Entry<Long,List<T>> entry1 : value.entrySet()){
                    stringListMap.put(encryptionService.encrypt(entry1.getKey().toString(),BLANK_KEY),entry1.getValue());
                }
                mapHashMap.put(encryptionService.encrypt(key.toString(),BLANK_KEY),stringListMap);
            }
        }
        return mapHashMap;
    }

    public static Map<String, Object> encryptMapKey(Map<Long, ? extends Object> map) {
        Map<String, Object> result = new HashMap<>();
        if (!ObjectUtils.isEmpty(map)) {
            for (Map.Entry<Long, ? extends Object> entry : map.entrySet()) {
                Long key = entry.getKey();
                Object value = entry.getValue();
                String encryptKey = encryptionService.encrypt(key.toString(), BLANK_KEY);
                result.put(encryptKey, value);
            }
        }
        return result;
    }

    public static String encrypt(Long value) {
        if (Objects.isNull(value)){
            return null;
        }
        return encryptionService.encrypt(value.toString(), BLANK_KEY);
    }

    public static String decryptSearchSourceVO(String filterJson) {
        if (StringUtils.isBlank(filterJson)){
            return filterJson;
        }
        if (Objects.isNull(encryptMapper)){
            encryptMapper = ApplicationContextHelper.getContext().getBean(ObjectMapper.class);
        }
        try {
            return JSON.toJSONString(encryptMapper.readValue(filterJson, SearchSourceVO.class));
        } catch (IOException e) {
            throw new CommonException(e);
        }
    }

    public static String encryptSearchSourceVO(String filterJson) {
        if (StringUtils.isBlank(filterJson)){
            return filterJson;
        }
        try {
            return encryptMapper.writeValueAsString(JSON.parseObject(filterJson, SearchSourceVO.class));
        } catch (IOException e) {
            throw new CommonException(e);
        }
    }
}
