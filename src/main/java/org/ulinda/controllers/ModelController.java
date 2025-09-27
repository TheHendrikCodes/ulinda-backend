package org.ulinda.controllers;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.ulinda.dto.*;
import org.ulinda.security.AuthenticationHelper;
import org.ulinda.services.ModelService;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Slf4j
public class ModelController {

    @Autowired
    private ModelService modelService;

    @Autowired
    private AuthenticationHelper authenticationHelper;

    @PostMapping("/create-model")
    @PreAuthorize("hasAnyRole('ADMIN', 'CREATE_MODELS')")
    public ResponseEntity<String> createModel(@RequestBody @Valid CreateModelRequest request, Authentication authentication) {
           modelService.createModel(request, authenticationHelper.getUserId(authentication));
            return ResponseEntity.status(HttpStatus.CREATED).body("Model created successfully");
    }

    @GetMapping("/models")
    public ResponseEntity<GetModelsResponse> getModels() {
        GetModelsResponse response = modelService.getModels();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/models/{modelId}")
    public ResponseEntity<GetModelResponse> getModel(@PathVariable("modelId") UUID modelId) {
        GetModelResponse response = modelService.getModel(modelId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/models/{modelId}/records")
    public ResponseEntity<UUID> createRecord(@PathVariable UUID modelId,
                                             @RequestBody @Valid CreateRecordRequest request) {
        UUID recordId = modelService.createRecord(modelId, request.getFieldValues());
        return ResponseEntity.ok(recordId);
    }

    @PutMapping("/records/{modelId}/{recordId}")
    public ResponseEntity<RecordDto> updateRecord(@PathVariable UUID recordId,
                                                  @PathVariable UUID modelId,
                                                  @RequestBody @Valid UpdateRecordRequest request) {
        RecordDto updatedRecord = modelService.updateRecord(modelId, recordId, request.getFieldValues());
        return ResponseEntity.ok(updatedRecord);
    }

    @GetMapping("/records/{modelId}/{recordId}")
    public ResponseEntity<RecordDto> getRecord(@PathVariable UUID recordId,
                                               @PathVariable UUID modelId) {
        RecordDto record = modelService.getRecord(modelId, recordId);
        return ResponseEntity.ok(record);
    }

    @DeleteMapping("/records/{modelId}/{recordId}")
    public void deleteRecord(@PathVariable UUID recordId,
                                               @PathVariable UUID modelId) {
        modelService.deleteRecord(modelId, recordId);
    }

    @PostMapping("/models/{modelId}/records/search")
    public ResponseEntity<GetRecordsResponse> getRecords(
            @PathVariable UUID modelId,
            @Valid @RequestBody GetRecordsRequest request) {

        GetRecordsResponse response = modelService.getRecords(request, modelId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/model/linked-records/{modelLinkId}/{linkId}")
    public void deleteLink(@PathVariable UUID modelLinkId, @PathVariable UUID linkId) {
        modelService.deleteRecordLink(modelLinkId, linkId);
    }

    @PostMapping("/models/link-models")
    public void linkModels(@Valid @RequestBody LinkModelsRequest linkModelsRequest) {
        modelService.linkModels(linkModelsRequest);
    }

    @PostMapping("/models/linked-models")
    public void updateLinkedModels(@Valid @RequestBody UpdateLinkedModelsRequest updateLinkedModelsRequest) {
        modelService.updatelinkModels(updateLinkedModelsRequest);
    }

    @GetMapping("/models/link-models")
    public ResponseEntity<GetModelLinksResponse> getLinkedModels() {
        return ResponseEntity.ok(modelService.getModelLinks());
    }

    @PostMapping("/records/link-records")
    public void linkRecords(@Valid @RequestBody LinkRecordsRequest request) {
        modelService.linkRecords(request);
    }

    @PostMapping("/fields/{modelId}")
    public void createNewField(@PathVariable UUID modelId, @RequestBody @Valid FieldDto fieldDto) {
        modelService.addField(modelId, fieldDto);
    }

    @DeleteMapping("/fields/{fieldId}")
    public void deleteField(@PathVariable UUID fieldId) {
        modelService.deleteField(fieldId);
    }

    @PutMapping("/models/{modelId}")
    public void updateModel(@PathVariable UUID modelId, @Valid @RequestBody UpdateModelRequest updateModelRequest) {
        modelService.updateModel(modelId, updateModelRequest);
    }

    @PutMapping("/fields/{fieldId}")
    public void updateField(@PathVariable UUID fieldId, @Valid @RequestBody UpdateFieldRequest updateModelRequest) {
        modelService.updateField(fieldId, updateModelRequest);
    }



}
